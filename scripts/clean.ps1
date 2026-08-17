# Mem Reduct — memory cleaning engine (requires administrator).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File clean.ps1 -Mask <0-255>
# Bit map: 1=Working set, 2=System file cache, 4=Standby priority-0 list,
#          8=Standby list, 16=Modified page list, 32=Combine memory lists,
#          64=Registry cache, 128=Modified file cache
param([int]$Mask = 231)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;

public static class Cleaner
{
    const int SystemMemoryListInformation = 80;
    const int SystemFileCacheInformation = 21;
    const int SystemRegistryReconciliationInformation = 74;
    const int SystemCombinePhysicalMemoryInformation = 130;

    const int MemoryFlushModifiedList = 1;
    const int MemoryPurgeStandbyList = 2;
    const int MemoryPurgeLowPriorityStandbyList = 3;

    const uint MAXSIZE_T = 0xFFFFFFFF;

    [DllImport("ntdll.dll")]
    static extern int NtSetSystemInformation(int SystemInformationClass, IntPtr SystemInformation, int SystemInformationLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetSystemFileCacheSize(IntPtr MinimumFileCacheSize, IntPtr MaximumFileCacheSize, uint Flags);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool FlushFileBuffers(IntPtr hFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr hObject);

    [DllImport("psapi.dll", SetLastError = true)]
    static extern bool EmptyWorkingSet(IntPtr hProcess);

    [DllImport("kernel32.dll")]
    static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);

    [DllImport("kernel32.dll")]
    static extern bool CloseHandleProcess(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);

    [StructLayout(LayoutKind.Sequential)]
    public struct MEMORYSTATUSEX
    {
        public uint dwLength;
        public uint dwMemoryLoad;
        public ulong ullTotalPhys;
        public ulong ullAvailPhys;
        public ulong ullTotalPageFile;
        public ulong ullAvailPageFile;
        public ulong ullTotalVirtual;
        public ulong ullAvailVirtual;
        public ulong ullAvailExtendedVirtual;
    }

    static void SetInfo(int cls, int len)
    {
        IntPtr p = Marshal.AllocHGlobal(Math.Max(len, 1));
        try
        {
            for (int i = 0; i < len; i++) Marshal.WriteByte(p, i, 0);
            int r = NtSetSystemInformation(cls, p, len);
            if (r != 0)
                throw new System.ComponentModel.Win32Exception(r);
        }
        finally { Marshal.FreeHGlobal(p); }
    }

    public static ulong GetAvailPhys()
    {
        MEMORYSTATUSEX m = new MEMORYSTATUSEX();
        m.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
        GlobalMemoryStatusEx(ref m);
        return m.ullAvailPhys;
    }

    public static string Run(int mask)
    {
        List<string> done = new List<string>();

        if ((mask & 1) != 0)
        {
            int ok = 0, fail = 0;
            Process[] procs = Process.GetProcesses();
            foreach (Process p in procs)
            {
                try
                {
                    IntPtr h = OpenProcess(0x0400 | 0x0010, false, p.Id);
                    if (h != IntPtr.Zero)
                    {
                        try { if (EmptyWorkingSet(h)) ok++; else fail++; }
                        finally { CloseHandleProcess(h); }
                    }
                    else fail++;
                }
                catch { fail++; }
            }
            done.Add("workingset:" + ok + "/" + fail);
        }
        if ((mask & 2) != 0)
        {
            try
            {
                if (SetSystemFileCacheSize(new IntPtr(unchecked((long)MAXSIZE_T)), new IntPtr(unchecked((long)MAXSIZE_T)), 1))
                    done.Add("filecache:ok");
                else done.Add("filecache:fail");
            }
            catch { done.Add("filecache:fail"); }
        }
        if ((mask & 128) != 0)
        {
            int flushed = 0;
            foreach (DriveInfo d in DriveInfo.GetDrives())
            {
                if (d.DriveType != DriveType.Fixed && d.DriveType != DriveType.Removable) continue;
                string name = "\\\\.\\" + d.Name.TrimEnd('\\');
                IntPtr h = CreateFile(name, 0x80000000 | 0x40000000, 0x1 | 0x2 | 0x4, IntPtr.Zero, 3, 0x02000000, IntPtr.Zero);
                if (h.ToInt64() != -1 && h.ToInt64() != 0)
                {
                    if (FlushFileBuffers(h)) flushed++;
                    CloseHandle(h);
                }
            }
            done.Add("flush:" + flushed);
        }
        if ((mask & 16) != 0)
        {
            try { SetInfo(SystemMemoryListInformation, sizeof(int)); done.Add("modifiedlist:ok"); }
            catch (Exception e) { done.Add("modifiedlist:fail:" + e.Message); }
        }
        if ((mask & 8) != 0)
        {
            try { SetInfo(SystemMemoryListInformation, sizeof(int) * 2); done.Add("standbylist:ok"); }
            catch (Exception e) { done.Add("standbylist:fail:" + e.Message); }
        }
        if ((mask & 4) != 0)
        {
            try { SetInfo(SystemMemoryListInformation, sizeof(int) * 3); done.Add("standbypriority0:ok"); }
            catch (Exception e) { done.Add("standbypriority0:fail:" + e.Message); }
        }
        if ((mask & 64) != 0)
        {
            try { SetInfo(SystemRegistryReconciliationInformation, 4096); done.Add("registrycache:ok"); }
            catch (Exception e) { done.Add("registrycache:fail:" + e.Message); }
        }
        if ((mask & 32) != 0)
        {
            try { SetInfo(SystemCombinePhysicalMemoryInformation, sizeof(int)); done.Add("combine:ok"); }
            catch (Exception e) { done.Add("combine:fail:" + e.Message); }
        }
        return string.Join("|", done.ToArray());
    }
}
'@

$before = [Cleaner]::GetAvailPhys()
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$results = $null
try {
    $results = [Cleaner]::Run($Mask)
} catch {
    $results = "error:" + $_.Exception.Message
}
$sw.Stop()
$after = [Cleaner]::GetAvailPhys()

$freed = [math]::Max(0, $after - $before)
[pscustomobject]@{
    before = $before
    after = $after
    freed = $freed
    durationMs = $sw.ElapsedMilliseconds
    mask = $Mask
    results = $results
} | ConvertTo-Json -Compress