; Wrayth Device Agent - Inno Setup installer
; Produces WraythSetup.exe: double-click, paste enrollment code, done.
; Installs WraythAgent.exe to Program Files, writes config to ProgramData,
; and registers a Windows service running as LocalSystem.

#define MyAppName        "Wrayth Device Agent"
#define MyAppShortName   "WraythAgent"
#define MyAppPublisher   "Ultrium LLC"
#define MyAppURL         "https://ultriumai.com"
#define MyAppExeName     "WraythAgent.exe"
#define MyServiceName    "WraythAgent"
#define MyServiceDisplay "Wrayth Device Agent"
#define MyDefaultApiBase "https://nsyobmjpdpvesjwdphlh.supabase.co"

#ifndef MyAppVersion
  #define MyAppVersion "0.2.0"
#endif

[Setup]
AppId={{A2B7C5D3-4E1F-4C93-9E2B-WRAYTH0000AGENT}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\Wrayth
DefaultGroupName=Wrayth
DisableProgramGroupPage=yes
DisableDirPage=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
OutputBaseFilename=WraythSetup
OutputDir=..\dist
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
CloseApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\dist\WraythAgent.exe";       DestDir: "{app}"; Flags: ignoreversion
; WinSW wrapper + its XML config. WinSW is what Windows registers as the
; service; it starts/stops WraythAgent.exe as a supervised child process.
Source: "..\dist\WraythService.exe";     DestDir: "{app}"; Flags: ignoreversion
Source: "WraythService.xml";             DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{commonappdata}\Wrayth";      Permissions: users-modify
Name: "{commonappdata}\Wrayth\logs"; Permissions: users-modify

[Run]
; If an older/broken installer registered WraythAgent.exe directly, replace
; that legacy service with the WinSW wrapper. We intentionally do this before
; registering WinSW, and only when Windows has not already queued deletion.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$svc = Get-CimInstance Win32_Service -Filter 'Name = ''{#MyServiceName}''' -ErrorAction SilentlyContinue; if ($svc -and ($svc.PathName -match 'WraythAgent\.exe') -and ($svc.PathName -notmatch 'WraythService\.exe')) {{ Stop-Service -Name '{#MyServiceName}' -Force -ErrorAction SilentlyContinue; sc.exe delete '{#MyServiceName}' | Out-Null; for ($i = 0; $i -lt 20; $i++) {{ Start-Sleep -Milliseconds 500; if (-not (Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue)) {{ break }} }} }}"""; \
  Flags: runhidden waituntilterminated; StatusMsg: "Preparing Wrayth service..."

; Write the config file (enrollment_code + api_base) collected in the wizard.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$c = @{{ enrollment_code = '{code:GetEnrollmentCode}'; api_base = '{code:GetApiBase}' }} | ConvertTo-Json; Set-Content -Path 'C:\ProgramData\Wrayth\wrayth-config.json' -Value $c -Encoding UTF8"""; \
  Flags: runhidden; StatusMsg: "Writing enrollment config..."

; Register (or refresh) the WinSW-managed service. Everything is logged to
; C:\ProgramData\Wrayth\logs\install.log so failures (WinSW missing runtime,
; permissions, etc.) leave a diagnosable trail instead of silently vanishing.
; If WinSW fails to register, we fall back to a direct sc.exe create so the
; service always ends up in services.msc. Finally we verify the service
; exists; if not, we raise a non-zero exit code so Inno surfaces an error.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$ErrorActionPreference='Continue'; $log='C:\ProgramData\Wrayth\logs\install.log'; New-Item -ItemType Directory -Force -Path 'C:\ProgramData\Wrayth\logs' | Out-Null; function L($m){{ Add-Content -Path $log -Value ((Get-Date -Format o) + ' ' + $m) }}; L '--- register start ---'; $svc = Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue; try {{ if ($svc) {{ L 'service exists, refreshing'; Stop-Service -Name '{#MyServiceName}' -Force -ErrorAction SilentlyContinue; & '{app}\WraythService.exe' refresh *>> $log }} else {{ L 'installing via WinSW'; & '{app}\WraythService.exe' install *>> $log }} }} catch {{ L ('winsw error: ' + $_.Exception.Message) }}; if (-not (Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue)) {{ L 'WinSW did not register service, falling back to sc.exe'; & sc.exe create '{#MyServiceName}' binPath= ('\""' + '{app}\WraythService.exe' + '\""') start= auto DisplayName= '{#MyServiceDisplay}' *>> $log }}; & sc.exe config '{#MyServiceName}' start= auto *>> $log; Start-Sleep -Seconds 1; try {{ Start-Service -Name '{#MyServiceName}' -ErrorAction Stop; L 'service started' }} catch {{ L ('start failed: ' + $_.Exception.Message) }}; $final = Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue; if (-not $final) {{ L 'FATAL: service still not registered'; exit 1618 }} else {{ L ('final state: ' + $final.Status); exit 0 }}"""; \
  Flags: runhidden waituntilterminated; StatusMsg: "Registering Wrayth service..."

[UninstallRun]
; Force-stop the WinSW-managed service (ignore errors if already stopped/disabled).
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""try {{ Set-Service -Name '{#MyServiceName}' -StartupType Manual -ErrorAction SilentlyContinue }} catch {{}}; try {{ Stop-Service -Name '{#MyServiceName}' -Force -ErrorAction SilentlyContinue }} catch {{}}; Get-Process -Name 'WraythService','WraythAgent' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"""; \
  Flags: runhidden waituntilterminated; RunOnceId: "StopWraythSvc"
; Ask WinSW to remove its own registration first (cleanest path).
Filename: "{app}\WraythService.exe"; Parameters: "uninstall"; Flags: runhidden waituntilterminated skipifdoesntexist; RunOnceId: "UninstWraythSvc"
; Belt-and-suspenders: if the service still exists (WinSW missing, disabled,
; or a legacy raw-agent registration), delete it directly via sc.exe. If
; Windows keeps the service in the "marked for deletion" state, write a marker
; so the uninstaller can clearly prompt for a reboot instead of looking done.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$marker = '{tmp}\wrayth-agent-reboot-required.flag'; if (Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue) {{ & sc.exe delete '{#MyServiceName}' | Out-Null; for ($i = 0; $i -lt 20; $i++) {{ Start-Sleep -Milliseconds 500; if (-not (Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue)) {{ break }} }}; if (Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue) {{ Set-Content -Path $marker -Value 'Service deletion is pending reboot.' -Encoding ASCII }} }}"""; \
  Flags: runhidden waituntilterminated; RunOnceId: "ScDeleteWraythSvc"

[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\Wrayth"

[Code]
var
  CodePage: TInputQueryWizardPage;
  DefaultCode: String;
  DefaultApi:  String;
  WraythRestartRequired: Boolean;

function GetCmdLineParam(const Name, Default: String): String;
var
  I: Integer;
  Prefix, Arg: String;
begin
  Result := Default;
  Prefix := '/' + Name + '=';
  for I := 1 to ParamCount do
  begin
    Arg := ParamStr(I);
    if (Length(Arg) >= Length(Prefix)) and
       (CompareText(Copy(Arg, 1, Length(Prefix)), Prefix) = 0) then
    begin
      Result := Copy(Arg, Length(Prefix) + 1, MaxInt);
      Exit;
    end;
  end;
end;

procedure InitializeWizard();
begin
  DefaultCode := GetCmdLineParam('CODE', '');
  DefaultApi  := GetCmdLineParam('API',  '{#MyDefaultApiBase}');

  CodePage := CreateInputQueryPage(
    wpWelcome,
    'Enrollment',
    'Connect this device to your Wrayth workspace',
    'Paste the one-time enrollment code shown in the Wrayth app ' +
    '(Threat Center -> Install device agent). The code is short-lived, ' +
    'so complete setup within a few minutes.');
  CodePage.Add('Enrollment code:', False);
  CodePage.Add('Wrayth API base URL:', False);
  CodePage.Values[0] := DefaultCode;
  CodePage.Values[1] := DefaultApi;
end;

function GetEnrollmentCode(Param: String): String;
begin
  Result := Trim(CodePage.Values[0]);
end;

function GetApiBase(Param: String): String;
begin
  Result := Trim(CodePage.Values[1]);
  if Result = '' then
    Result := '{#MyDefaultApiBase}';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = CodePage.ID then
  begin
    if Trim(CodePage.Values[0]) = '' then
    begin
      MsgBox('Please paste the enrollment code from the Wrayth app before continuing.',
             mbError, MB_OK);
      Result := False;
    end;
  end;
end;

function IsWraythServiceMarkedForDeletion(): Boolean;
var
  DeleteFlag: Cardinal;
begin
  Result := RegQueryDWordValue(
    HKLM,
    'SYSTEM\CurrentControlSet\Services\{#MyServiceName}',
    'DeleteFlag',
    DeleteFlag) and (DeleteFlag <> 0);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';

  if IsWraythServiceMarkedForDeletion() then
  begin
    NeedsRestart := True;
    WraythRestartRequired := True;
    Result :=
      'Windows has already marked the Wrayth service for deletion, usually ' +
      'because Services.msc or Task Manager was open during a previous repair. ' +
      'Close Services.msc, reboot Windows, then run WraythSetup.exe again with ' +
      'a fresh enrollment code.';
  end;
end;

function WraythRebootMarkerExists(): Boolean;
begin
  Result := FileExists(ExpandConstant('{tmp}\wrayth-agent-reboot-required.flag'));
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    if WraythRebootMarkerExists() or IsWraythServiceMarkedForDeletion() then
    begin
      WraythRestartRequired := True;
      MsgBox(
        'Windows has marked the Wrayth service for deletion, but it cannot be fully removed until you reboot. ' +
        'This is normal when Services.msc, Task Manager, or Event Viewer held the service open. Reboot Windows before reinstalling WraythSetup.exe.',
        mbInformation,
        MB_OK);
    end;
  end;
end;

function NeedRestart(): Boolean;
begin
  Result := WraythRestartRequired or WraythRebootMarkerExists() or IsWraythServiceMarkedForDeletion();
end;
