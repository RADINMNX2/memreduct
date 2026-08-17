# Mem Reduct — memory statistics daemon.
# Reads physical / pagefile / system cache usage and emits one JSON line per second.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File stats.ps1 [-Loop] [-Once]
param([switch]$Once)

$ErrorActionPreference = 'SilentlyContinue'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MemNative {
    [StructLayout(LayoutKind.Sequential)]
    public struct MEMORYSTATUSEX {
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
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);
}
'@

function Get-PhysMemory {
    $m = New-Object MemNative+MEMORYSTATUSEX
    $m.dwLength = [System.Runtime.InteropServices.Marshal]::SizeOf($m)
    [MemNative]::GlobalMemoryStatusEx([ref]$m) | Out-Null
    return ,$m
}

function Get-Stats {
    $m = Get-PhysMemory
    $total = $m.ullTotalPhys
    $avail = $m.ullAvailPhys
    $used = $total - $avail
    $physPercent = if ($total -gt 0) { [math]::Round($used * 100.0 / $total, 2) } else { 0 }

    $pf = Get-CimInstance -ClassName Win32_PageFileUsage
    $pfTotal = 0; $pfUsed = 0
    if ($pf) {
        foreach ($p in $pf) {
            $pfTotal += [long]$p.AllocatedBaseSize * 1MB
            $pfUsed += [long]$p.CurrentUsage * 1MB
        }
    }
    $pfPercent = if ($pfTotal -gt 0) { [math]::Round($pfUsed * 100.0 / $pfTotal, 2) } else { 0 }

    $cache = 0
    $perf = Get-CimInstance -ClassName Win32_PerfFormattedData_PerfOS_Memory
    if ($perf) { $cache = [long]$perf.CacheBytes }
    $cachePercent = if ($total -gt 0) { [math]::Round($cache * 100.0 / $total, 2) } else { 0 }

    $pfFree = $pfTotal - $pfUsed; if ($pfFree -lt 0) { $pfFree = 0 }
    [pscustomobject]@{
        time = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        physical = @{
            total = $total; available = $avail; used = $used; percent = $physPercent
        }
        pagefile = @{
            total = $pfTotal; available = $pfFree; used = $pfUsed; percent = $pfPercent
        }
        cache = @{
            used = $cache; percent = $cachePercent
        }
    } | ConvertTo-Json -Compress
}

if ($Once) {
    Write-Output (Get-Stats)
    exit 0
}

while ($true) {
    try {
        Write-Output (Get-Stats)
    } catch {
        Write-Output ('{"error":"' + $_.Exception.Message.Replace('"', "'") + '"}')
    }
    Start-Sleep -Milliseconds 1000
}