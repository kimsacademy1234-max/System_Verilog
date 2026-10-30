# vim 오른쪽 위 CAPS / 한 표시용 키 상태 감시 (~/.vim/keystate.ps1, vim 이 job 으로 실행)
# 0.2초마다 Caps Lock 과 터미널 창의 한/영 상태를 확인해서 바뀔 때만 숫자 출력 (1: Caps Lock, 2: 한글, 3: 둘 다)
Add-Type -MemberDefinition @'
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr h, out int p);
[DllImport("imm32.dll")] public static extern IntPtr ImmGetDefaultIMEWnd(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, IntPtr w, IntPtr l, uint f, uint t, out IntPtr r);
'@ -Name K -Namespace KeyState
# 한/영은 앞 창이 터미널일 때만 읽음 (브라우저·Discord 등은 값이 엉뚱하고, vim 을 안 보고 있으니 마지막 상태 유지)
$terms = @('WindowsTerminal', 'OpenConsole', 'conhost', 'wezterm-gui', 'alacritty', 'mintty')
$names = @{}
$han = 0
$p = -1
while ($true) {
    $fg = [KeyState.K]::GetForegroundWindow()
    $id = 0
    [void][KeyState.K]::GetWindowThreadProcessId($fg, [ref]$id)
    if (-not $names.ContainsKey($id)) { $names[$id] = (Get-Process -Id $id -ErrorAction SilentlyContinue).ProcessName }
    if ($terms -contains $names[$id]) {
        $ime = [KeyState.K]::ImmGetDefaultIMEWnd($fg)
        $r = [IntPtr]::Zero
        # WM_IME_CONTROL(0x283) / IMC_GETCONVERSIONMODE(1) → 1번 비트가 한글 모드, 응답 없는 창은 100ms 후 포기
        if ($ime -ne [IntPtr]::Zero -and [KeyState.K]::SendMessageTimeout($ime, 0x283, [IntPtr]1, [IntPtr]::Zero, 2, 100, [ref]$r) -ne [IntPtr]::Zero) {
            $han = [int]($r.ToInt64() -band 1)
        }
    }
    $s = [int][console]::CapsLock + 2 * $han
    if ($s -ne $p) { [Console]::Out.WriteLine($s); [Console]::Out.Flush(); $p = $s }
    Start-Sleep -Milliseconds 200
}
