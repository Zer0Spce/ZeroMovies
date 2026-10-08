using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new UpdateForm(args));
    }

    sealed class UpdateForm : Form
    {
        readonly string[] args;
        readonly Label title = new() { AutoSize = true, Font = new Font("Segoe UI", 16, FontStyle.Bold), Text = "Updating ZeroPlay" };
        readonly Label status = new() { AutoSize = true, Font = new Font("Segoe UI", 10), Text = "Preparing update…" };
        readonly ProgressBar progress = new() { Minimum = 0, Maximum = 100, Value = 2 };
        readonly TextBox log = new() { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, BackColor = Color.FromArgb(20,20,20), ForeColor = Color.Gainsboro, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Consolas", 9) };
        readonly Button close = new() { Text = "Close", Enabled = false, AutoSize = true };
        string root = "";

        public UpdateForm(string[] args)
        {
            this.args = args;
            Text = "ZeroPlay Updater";
            Width = 620; Height = 430; MinimumSize = new Size(560, 380);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(15,15,15); ForeColor = Color.White;
            FormBorderStyle = FormBorderStyle.FixedDialog; MaximizeBox = false;
            var panel = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(24), ColumnCount = 1, RowCount = 6 };
            panel.RowStyles.Add(new RowStyle(SizeType.AutoSize)); panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            panel.RowStyles.Add(new RowStyle(SizeType.Absolute, 36)); panel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            panel.RowStyles.Add(new RowStyle(SizeType.AutoSize)); panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            title.Margin = new Padding(0,0,0,8); status.Margin = new Padding(0,0,0,12); progress.Dock = DockStyle.Fill;
            log.Dock = DockStyle.Fill; log.Margin = new Padding(0,12,0,12); close.Anchor = AnchorStyles.Right; close.Click += (_,__) => Close();
            panel.Controls.Add(title); panel.Controls.Add(status); panel.Controls.Add(progress); panel.Controls.Add(log); panel.Controls.Add(close);
            Controls.Add(panel);
            Shown += async (_,__) => await RunUpdate();
            FormClosing += (_,e) => { if (!close.Enabled) e.Cancel = true; };
        }

        void Step(string text, int percent)
        {
            status.Text = text; progress.Value = Math.Max(0, Math.Min(100, percent));
            log.AppendText($"[{DateTime.Now:HH:mm:ss}] {text}{Environment.NewLine}");
            Application.DoEvents();
        }

        async Task RunUpdate()
        {
            try
            {
                var options = Parse(args);
                root = Full(Required(options, "root"));
                string zip = Full(Required(options, "zip"));
                string version = Required(options, "version");
                string expected = Required(options, "sha256").ToLowerInvariant();
                int waitPid = options.TryGetValue("wait-pid", out var pidText) && int.TryParse(pidText, out var parsedPid) ? parsedPid : 0;
                string downloadDir = Path.GetDirectoryName(zip) ?? "";

                Step("Verifying downloaded package…", 10);
                if (!File.Exists(zip)) throw new InvalidOperationException("Downloaded update package is missing.");
                if (!File.Exists(Path.Combine(root, "ZeroPlay.exe"))) throw new InvalidOperationException("Stable ZeroPlay launcher is missing.");
                await Task.Run(() => VerifySha(zip, expected));

                Step("Waiting for ZeroPlay to close…", 20);
                await Task.Run(() => WaitForProcess(waitPid));

                string versionsDir = Path.Combine(root, "versions");
                Directory.CreateDirectory(versionsDir);
                string work = Path.Combine(versionsDir, ".install-" + SafeVersion(version) + "-" + Guid.NewGuid().ToString("N"));
                string extract = Path.Combine(work, "extract");
                Directory.CreateDirectory(extract);
                try
                {
                    Step("Extracting update files…", 40);
                    await Task.Run(() => ZipFile.ExtractToDirectory(zip, extract, true));

                    Step("Validating portable build…", 58);
                    string portable = LocatePortableRoot(extract);
                    string finalDir = Path.Combine(versionsDir, SafeVersion(version));

                    Step("Installing ZeroPlay " + version + "…", 72);
                    if (Directory.Exists(finalDir)) Directory.Delete(finalDir, true);
                    if (Path.GetFullPath(portable).TrimEnd(Path.DirectorySeparatorChar).Equals(Path.GetFullPath(extract).TrimEnd(Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase)) Directory.Move(extract, finalDir);
                    else Directory.Move(portable, finalDir);
                    ValidatePortable(finalDir);

                    Step("Switching active version…", 88);
                    Activate(root, version, finalDir);
                    TryDelete(zip);
                    TryDeleteDirectory(work);
                    if (!string.IsNullOrWhiteSpace(downloadDir)) TryDeleteDirectory(downloadDir);

                    Step("Relaunching ZeroPlay…", 96);
                    await Task.Delay(500);
                    Launch(Path.Combine(root, "ZeroPlay.exe"), root);

                    Step("Update completed successfully.", 100);
                    title.Text = "ZeroPlay updated";
                    close.Text = "Done"; close.Enabled = true;
                    await Task.Delay(2200);
                    Close();
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
                    if (string.IsNullOrWhiteSpace(root)) root = args.SkipWhile(x => x != "--root").Skip(1).FirstOrDefault() ?? AppContext.BaseDirectory;
                    Directory.CreateDirectory(root);
                    File.WriteAllText(Path.Combine(root, "ZeroPlayUpdater-error.txt"), DateTimeOffset.Now + Environment.NewLine + error);
                }
                catch { }
                title.Text = "Update failed";
                status.Text = error.Message;
                progress.Value = 0;
                log.AppendText(Environment.NewLine + "FAILED: " + error + Environment.NewLine);
                close.Enabled = true;
            }
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
        var queue = new Queue<(string Dir,int Depth)>(); queue.Enqueue((stage, 0));
        while (queue.Count > 0)
        {
            var (dir, depth) = queue.Dequeue();
            if (File.Exists(Path.Combine(dir, "ZeroPlay.exe")) && File.Exists(Path.Combine(dir, "resources", "app.asar"))) return dir;
            if (depth >= 4) continue;
            foreach (var child in Directory.EnumerateDirectories(dir)) if (!Path.GetFileName(child).Equals("__MACOSX", StringComparison.OrdinalIgnoreCase)) queue.Enqueue((child, depth + 1));
        }
        throw new InvalidOperationException("The update archive is incomplete: ZeroPlay.exe and resources/app.asar were not found together.");
    }

    static void ValidatePortable(string dir)
    {
        if (!File.Exists(Path.Combine(dir, "ZeroPlay.exe")) || !File.Exists(Path.Combine(dir, "resources", "app.asar"))) throw new InvalidOperationException("The installed version is incomplete.");
    }

    static JsonObject? ReadPointer(string file) { try { return JsonNode.Parse(File.ReadAllText(file)) as JsonObject; } catch { return null; } }
    static bool SafeRelativePath(string root, string? relative)
    {
        if (string.IsNullOrWhiteSpace(relative)) return false;
        string target = Path.GetFullPath(Path.Combine(root, relative));
        string normalizedRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        return target.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase) && File.Exists(target);
    }

    static void Activate(string root, string version, string finalDir)
    {
        string pointerFile = Path.Combine(root, "current.json"); JsonObject? existing = ReadPointer(pointerFile); JsonObject previous;
        if (existing != null && SafeRelativePath(root, existing["path"]?.GetValue<string>()) && !string.Equals(existing["version"]?.GetValue<string>(), version, StringComparison.OrdinalIgnoreCase)) previous = new JsonObject { ["version"] = existing["version"]?.GetValue<string>() ?? "base", ["path"] = existing["path"]?.GetValue<string>() };
        else if (existing?["previous"] is JsonObject oldPrevious) previous = new JsonObject { ["version"] = oldPrevious["version"]?.GetValue<string>() ?? "base", ["path"] = oldPrevious["path"]?.GetValue<string>() ?? "ZeroPlay.exe" };
        else previous = new JsonObject { ["version"] = "base", ["path"] = "ZeroPlay.exe" };
        string relative = Path.GetRelativePath(root, Path.Combine(finalDir, "ZeroPlay.exe"));
        var next = new JsonObject { ["version"] = version, ["path"] = relative, ["pending"] = true, ["previous"] = previous, ["activatedAt"] = DateTimeOffset.UtcNow.ToString("O") };
        string temp = pointerFile + ".tmp-" + Environment.ProcessId; File.WriteAllText(temp, next.ToJsonString(new JsonSerializerOptions { WriteIndented = true })); File.Move(temp, pointerFile, true);
    }

    static void Launch(string exe, string cwd)
    {
        Process.Start(new ProcessStartInfo(exe) { WorkingDirectory = cwd, UseShellExecute = true });
    }
    static void TryDelete(string path) { try { File.Delete(path); } catch { } }
    static void TryDeleteDirectory(string path) { try { if (Directory.Exists(path)) Directory.Delete(path, true); } catch { } }
}
