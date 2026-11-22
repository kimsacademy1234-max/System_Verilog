# vim 오른쪽 위 CAPS / 한 표시용 키 상태 감시 (~/.vim/keystate.ps1, vim 이 job 으로 실행)
# 0.2초마다 Caps Lock 과 터미널 창의 한/영 상태를 확인해서 바뀔 때만 숫자 출력 (1: Caps Lock, 2: 한글, 3: 둘 다)
# vim 이 stdin 으로 "off" 를 보내면 (Insert 모드에서 Esc) → 한글이면 영어로, Caps Lock 이면 끔
Add-Type -MemberDefinition @'
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr h, out int p);
[DllImport("imm32.dll")] public static extern IntPtr ImmGetDefaultIMEWnd(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, IntPtr w, IntPtr l, uint f, uint t, out IntPtr r);
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, IntPtr extra);
'@ -Name K -Namespace KeyState
# 한/영은 앞 창이 터미널일 때만 읽음 (브라우저·Discord 등은 값이 엉뚱하고, vim 을 안 보고 있으니 마지막 상태 유지)
$terms = @('WindowsTerminal', 'OpenConsole', 'conhost', 'wezterm-gui', 'alacritty', 'mintty')
$names = @{}
$han = 0
$p = -1
# stdin 은 기다리지 않고(비동기) 읽음 → 감시 루프는 그대로 0.2초마다 돎
$reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput())
$line = $reader.ReadLineAsync()
# 앞 창이 터미널이면 그 창의 IME 창 핸들, 아니면 0
function Get-TermIme {
    $fg = [KeyState.K]::GetForegroundWindow()
    $id = 0
    [void][KeyState.K]::GetWindowThreadProcessId($fg, [ref]$id)
    if (-not $names.ContainsKey($id)) { $names[$id] = (Get-Process -Id $id -ErrorAction SilentlyContinue).ProcessName }
    if ($terms -contains $names[$id]) { return [KeyState.K]::ImmGetDefaultIMEWnd($fg) }
    return [IntPtr]::Zero
}
function Set-Off {
    # Caps Lock: 켜져 있으면 Caps Lock 키를 한 번 눌렀다 뗌 (VK_CAPITAL 0x14, 스캔코드 0x3A, 2 = 키 뗌)
    if ([console]::CapsLock) {
        [KeyState.K]::keybd_event(0x14, 0x3A, 0, [IntPtr]::Zero)
        [KeyState.K]::keybd_event(0x14, 0x3A, 2, [IntPtr]::Zero)
    }
    # 한/영: WM_IME_CONTROL(0x283) / IMC_GETCONVERSIONMODE(1) 로 읽고, 한글 비트(1)를 뺀 값을 IMC_SETCONVERSIONMODE(2) 로 씀
    $ime = Get-TermIme
    $r = [IntPtr]::Zero
    if ($ime -ne [IntPtr]::Zero -and [KeyState.K]::SendMessageTimeout($ime, 0x283, [IntPtr]1, [IntPtr]::Zero, 2, 100, [ref]$r) -ne [IntPtr]::Zero) {
        $mode = $r.ToInt64()
        if ($mode -band 1) {
            [void][KeyState.K]::SendMessageTimeout($ime, 0x283, [IntPtr]2, [IntPtr]($mode -band -2), 2, 100, [ref]$r)
        }
    }
}
while ($true) {
    # vim 에서 온 명령 처리 (vim 이 닫혀 stdin 이 끝나면 null → 같이 종료)
    while ($line.IsCompleted) {
        $cmd = $line.Result
        if ($null -eq $cmd) { exit }
        if ($cmd.Trim() -eq 'off') { Set-Off }
        $line = $reader.ReadLineAsync()
    }
    $ime = Get-TermIme
    if ($ime -ne [IntPtr]::Zero) {
        $r = [IntPtr]::Zero
        # 1번 비트가 한글 모드, 응답 없는 창은 100ms 후 포기
        if ([KeyState.K]::SendMessageTimeout($ime, 0x283, [IntPtr]1, [IntPtr]::Zero, 2, 100, [ref]$r) -ne [IntPtr]::Zero) {
            $han = [int]($r.ToInt64() -band 1)
        }
    }
    $s = [int][console]::CapsLock + 2 * $han
    if ($s -ne $p) { [Console]::Out.WriteLine($s); [Console]::Out.Flush(); $p = $s }
    Start-Sleep -Milliseconds 200
}
