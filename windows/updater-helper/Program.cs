using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;

static class Program
{
    static int Main(string[] args)
    {
        try
        {
            var options = Parse(args);
            string root = Full(Required(options, "root"));
            string zip = Full(Required(options, "zip"));
            string version = Required(options, "version");
            string expected = Required(options, "sha256").ToLowerInvariant();
            int waitPid = options.TryGetValue("wait-pid", out var pidText) && int.TryParse(pidText, out var parsedPid) ? parsedPid : 0;
            if (!File.Exists(zip)) throw new InvalidOperationException("Downloaded update package is missing.");
            if (!File.Exists(Path.Combine(root, "ZeroPlay.exe"))) throw new InvalidOperationException("Stable ZeroPlay launcher is missing.");
            VerifySha(zip, expected);

            string versionsDir = Path.Combine(root, "versions");
            Directory.CreateDirectory(versionsDir);
            string work = Path.Combine(versionsDir, ".install-" + SafeVersion(version) + "-" + Guid.NewGuid().ToString("N"));
            string extract = Path.Combine(work, "extract");
            Directory.CreateDirectory(extract);
            try
            {
                ZipFile.ExtractToDirectory(zip, extract, true);
                string portable = LocatePortableRoot(extract);
                string finalDir = Path.Combine(versionsDir, SafeVersion(version));
                WaitForProcess(waitPid);
                if (Directory.Exists(finalDir)) Directory.Delete(finalDir, true);
                if (Path.GetFullPath(portable).TrimEnd(Path.DirectorySeparatorChar).Equals(Path.GetFullPath(extract).TrimEnd(Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase))
                    Directory.Move(extract, finalDir);
                else
                    Directory.Move(portable, finalDir);

                ValidatePortable(finalDir);
                Activate(root, version, finalDir);
                TryDelete(zip);
                TryDeleteDirectory(work);
                Launch(Path.Combine(root, "ZeroPlay.exe"), root);
                return 0;
            }
            catch
            {
                TryDeleteDirectory(work);
                throw;
            }
        }
        catch (Exception error)
        {
            try
            {
                string root = args.SkipWhile(x => x != "--root").Skip(1).FirstOrDefault() ?? AppContext.BaseDirectory;
                Directory.CreateDirectory(root);
                File.WriteAllText(Path.Combine(root, "ZeroPlayUpdater-error.txt"), DateTimeOffset.Now + Environment.NewLine + error);
            }
            catch { }
            return 1;
        }
    }

    static Dictionary<string,string> Parse(string[] args)
    {
        var result = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i + 1 < args.Length; i += 2)
        {
            if (!args[i].StartsWith("--")) throw new ArgumentException("Invalid updater argument.");
            result[args[i][2..]] = args[i + 1];
        }
        return result;
    }

    static string Required(Dictionary<string,string> values, string key) => values.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : throw new ArgumentException("Missing --" + key);
    static string Full(string value) => Path.GetFullPath(value.Trim('"'));
    static string SafeVersion(string version) => version.All(c => char.IsDigit(c) || c == '.') && version.Length <= 40 ? version : throw new ArgumentException("Invalid update version.");

    static void VerifySha(string file, string expected)
    {
        if (expected.Length != 64 || expected.Any(c => !Uri.IsHexDigit(c))) throw new InvalidOperationException("Invalid trusted SHA-256 value.");
        using var stream = File.OpenRead(file);
        string actual = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(actual), Convert.FromHexString(expected))) throw new InvalidOperationException("Downloaded update failed SHA-256 verification.");
    }

    static void WaitForProcess(int pid)
    {
        if (pid <= 0 || pid == Environment.ProcessId) return;
        try
        {
            using var process = Process.GetProcessById(pid);
            if (!process.WaitForExit(30000)) throw new TimeoutException("ZeroPlay did not close in time for the update.");
        }
        catch (ArgumentException) { }
    }

    static string LocatePortableRoot(string stage)
    {
        var queue = new Queue<(string Dir,int Depth)>();
        queue.Enqueue((stage, 0));
        while (queue.Count > 0)
        {
            var (dir, depth) = queue.Dequeue();
            if (File.Exists(Path.Combine(dir, "ZeroPlay.exe")) && File.Exists(Path.Combine(dir, "resources", "app.asar"))) return dir;
            if (depth >= 4) continue;
            foreach (var child in Directory.EnumerateDirectories(dir))
                if (!Path.GetFileName(child).Equals("__MACOSX", StringComparison.OrdinalIgnoreCase)) queue.Enqueue((child, depth + 1));
        }
        throw new InvalidOperationException("The update archive is incomplete: ZeroPlay.exe and resources/app.asar were not found together.");
    }

    static void ValidatePortable(string dir)
    {
        if (!File.Exists(Path.Combine(dir, "ZeroPlay.exe")) || !File.Exists(Path.Combine(dir, "resources", "app.asar"))) throw new InvalidOperationException("The installed version is incomplete.");
    }

    static JsonObject? ReadPointer(string file)
    {
        try { return JsonNode.Parse(File.ReadAllText(file)) as JsonObject; } catch { return null; }
    }

    static bool SafeRelativePath(string root, string? relative)
    {
        if (string.IsNullOrWhiteSpace(relative)) return false;
        string target = Path.GetFullPath(Path.Combine(root, relative));
        string normalizedRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        return target.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase) && File.Exists(target);
    }

    static void Activate(string root, string version, string finalDir)
    {
        string pointerFile = Path.Combine(root, "current.json");
        JsonObject? existing = ReadPointer(pointerFile);
        JsonObject previous;
        if (existing != null && SafeRelativePath(root, existing["path"]?.GetValue<string>()))
            previous = new JsonObject { ["version"] = existing["version"]?.GetValue<string>() ?? "base", ["path"] = existing["path"]?.GetValue<string>() };
        else
            previous = new JsonObject { ["version"] = "base", ["path"] = "ZeroPlay.exe" };

        string relative = Path.GetRelativePath(root, Path.Combine(finalDir, "ZeroPlay.exe"));
        var next = new JsonObject
        {
            ["version"] = version,
            ["path"] = relative,
            ["pending"] = true,
            ["previous"] = previous,
            ["activatedAt"] = DateTimeOffset.UtcNow.ToString("O")
        };
        string temp = pointerFile + ".tmp-" + Environment.ProcessId;
        File.WriteAllText(temp, next.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        File.Move(temp, pointerFile, true);
    }

    static void Launch(string exe, string cwd)
    {
        Process.Start(new ProcessStartInfo(exe) { WorkingDirectory = cwd, UseShellExecute = false, CreateNoWindow = true });
    }

    static void TryDelete(string path) { try { File.Delete(path); } catch { } }
    static void TryDeleteDirectory(string path) { try { if (Directory.Exists(path)) Directory.Delete(path, true); } catch { } }
}
