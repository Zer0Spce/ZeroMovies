using System;
using System.Runtime.InteropServices;

namespace ZeroPlay.MpvVideoHost;

internal static class Program
{
    private const int WS_CHILD = unchecked((int)0x40000000);
    private const int WS_VISIBLE = unchecked((int)0x10000000);
    private const int WS_CLIPSIBLINGS = unchecked((int)0x04000000);
    private const int WS_CLIPCHILDREN = unchecked((int)0x02000000);
    private const uint SWP_NOACTIVATE = 0x0010;
    private const uint SWP_SHOWWINDOW = 0x0040;
    private const uint WM_TIMER = 0x0113;
    private const uint WM_DESTROY = 0x0002;
    private const uint WM_ERASEBKGND = 0x0014;
    private const int BLACK_BRUSH = 4;
    private static readonly IntPtr HWND_TOP = IntPtr.Zero;

    private static IntPtr _parent;
    private static IntPtr _window;
    private static readonly WndProcDelegate WndProcInstance = WindowProc;

    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Length < 1 || !long.TryParse(args[0], out var rawParent) || rawParent == 0)
            return 2;

        _parent = new IntPtr(rawParent);
        if (!IsWindow(_parent)) return 3;

        var instance = GetModuleHandle(null);
        var className = "ZeroPlayMpvVideoHost_" + Environment.ProcessId;
        var wc = new WNDCLASSEX
        {
            cbSize = (uint)Marshal.SizeOf<WNDCLASSEX>(),
            lpfnWndProc = WndProcInstance,
            hInstance = instance,
            hbrBackground = GetStockObject(BLACK_BRUSH),
            lpszClassName = className
        };
        if (RegisterClassEx(ref wc) == 0) return 4;

        _window = CreateWindowEx(
            0,
            className,
            "ZeroPlay mpv video surface",
            WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS | WS_CLIPCHILDREN,
            0, 0, 1, 1,
            _parent,
            IntPtr.Zero,
            instance,
            IntPtr.Zero);
        if (_window == IntPtr.Zero) return 5;

        ResizeToParent();
        ShowWindow(_window, 5);
        UpdateWindow(_window);
        SetTimer(_window, new IntPtr(1), 100, IntPtr.Zero);

        Console.Out.WriteLine(_window.ToInt64());
        Console.Out.Flush();

        while (GetMessage(out var msg, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }
        return 0;
    }

    private static IntPtr WindowProc(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam)
    {
        if (msg == WM_TIMER)
        {
            if (!IsWindow(_parent))
            {
                DestroyWindow(hwnd);
                return IntPtr.Zero;
            }
            ResizeToParent();
            return IntPtr.Zero;
        }
        if (msg == WM_ERASEBKGND) return new IntPtr(1);
        if (msg == WM_DESTROY)
        {
            PostQuitMessage(0);
            return IntPtr.Zero;
        }
        return DefWindowProc(hwnd, msg, wParam, lParam);
    }

    private static void ResizeToParent()
    {
        if (_window == IntPtr.Zero || !GetClientRect(_parent, out var rect)) return;
        var width = Math.Max(1, rect.Right - rect.Left);
        var height = Math.Max(1, rect.Bottom - rect.Top);
        SetWindowPos(_window, HWND_TOP, 0, 0, width, height, SWP_NOACTIVATE | SWP_SHOWWINDOW);
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WNDCLASSEX
    {
        public uint cbSize;
        public uint style;
        public WndProcDelegate lpfnWndProc;
        public int cbClsExtra;
        public int cbWndExtra;
        public IntPtr hInstance;
        public IntPtr hIcon;
        public IntPtr hCursor;
        public IntPtr hbrBackground;
        [MarshalAs(UnmanagedType.LPWStr)] public string? lpszMenuName;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpszClassName;
        public IntPtr hIconSm;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public UIntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public POINT pt;
        public uint lPrivate;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int X, Y; }

    private delegate IntPtr WndProcDelegate(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern ushort RegisterClassEx(ref WNDCLASSEX lpwcx);
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateWindowEx(int exStyle, string className, string windowName, int style, int x, int y, int width, int height, IntPtr parent, IntPtr menu, IntPtr instance, IntPtr param);
    [DllImport("user32.dll")] private static extern IntPtr DefWindowProc(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr hwnd, int cmdShow);
    [DllImport("user32.dll")] private static extern bool UpdateWindow(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern bool DestroyWindow(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern bool IsWindow(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern bool GetClientRect(IntPtr hwnd, out RECT rect);
    [DllImport("user32.dll")] private static extern bool SetWindowPos(IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] private static extern IntPtr SetTimer(IntPtr hwnd, IntPtr id, uint elapse, IntPtr callback);
    [DllImport("user32.dll")] private static extern sbyte GetMessage(out MSG msg, IntPtr hwnd, uint min, uint max);
    [DllImport("user32.dll")] private static extern bool TranslateMessage(ref MSG msg);
    [DllImport("user32.dll")] private static extern IntPtr DispatchMessage(ref MSG msg);
    [DllImport("user32.dll")] private static extern void PostQuitMessage(int exitCode);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr GetModuleHandle(string? moduleName);
    [DllImport("gdi32.dll")] private static extern IntPtr GetStockObject(int fnObject);
}
