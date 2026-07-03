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
  #define MyAppVersion "0.2.1"
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
SetupIconFile=favicon.ico
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
Source: "install-wrayth-service.ps1";     DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{commonappdata}\Wrayth";      Permissions: users-modify
Name: "{commonappdata}\Wrayth\logs"; Permissions: users-modify

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
; Wait for the WraythAgent / WraythService processes AND their open file
; handles to actually release, then retry-delete the on-disk files that
; Inno's built-in [UninstallDelete] sweep otherwise trips over ("Some
; elements could not be removed. These can be removed manually.").
; We loop up to ~15s so slow log flushes / AV scanners get a chance.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$ErrorActionPreference='SilentlyContinue'; for ($i = 0; $i -lt 30; $i++) {{ $p = Get-Process -Name 'WraythService','WraythAgent'; if (-not $p) {{ break }}; Stop-Process -InputObject $p -Force; Start-Sleep -Milliseconds 500 }}; $targets = @('{app}\WraythAgent.exe','{app}\WraythService.exe','{app}\WraythService.xml','{app}\install-wrayth-service.ps1'); Get-ChildItem -Path '{app}' -Filter 'WraythService*.log' -ErrorAction SilentlyContinue | ForEach-Object {{ $targets += $_.FullName }}; Get-ChildItem -Path '{app}' -Filter 'WraythService*.wrapper.log' -ErrorAction SilentlyContinue | ForEach-Object {{ $targets += $_.FullName }}; foreach ($t in $targets) {{ for ($j = 0; $j -lt 10; $j++) {{ if (-not (Test-Path -LiteralPath $t)) {{ break }}; try {{ Remove-Item -LiteralPath $t -Force -ErrorAction Stop }} catch {{ Start-Sleep -Milliseconds 400 }} }} }}; Get-ChildItem -Path '{commonappdata}\Wrayth\logs' -File -ErrorAction SilentlyContinue | ForEach-Object {{ for ($j = 0; $j -lt 10; $j++) {{ try {{ Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop; break }} catch {{ Start-Sleep -Milliseconds 400 }} }} }}"""; \
  Flags: runhidden waituntilterminated; RunOnceId: "WraythReleaseHandles"

[UninstallDelete]
; Both {app} and the ProgramData tree — the retry loop above already tried
; hard, but this catches anything the loop didn't know about (e.g. rotated
; log files or ancillary files added by future versions).
Type: filesandordirs; Name: "{commonappdata}\Wrayth"
Type: filesandordirs; Name: "{app}\WraythService*.log"
Type: filesandordirs; Name: "{app}\WraythService*.wrapper.log"

[Code]
var
  CodePage: TInputQueryWizardPage;
  DefaultCode: String;
  DefaultApi:  String;
  WraythRestartRequired: Boolean;
  HasExistingEnrollment: Boolean;

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

function DetectExistingEnrollment(): Boolean;
var
  ConfigPath, Contents: String;
begin
  Result := False;
  ConfigPath := ExpandConstant('{commonappdata}\Wrayth\wrayth-config.json');
  if not FileExists(ConfigPath) then
    Exit;
  if not LoadStringFromFile(ConfigPath, Contents) then
    Exit;
  // Presence of a device_token means this machine is already enrolled.
  // Reusing the token keeps the same device row on the server (no duplicate).
  Result := Pos('"device_token"', Contents) > 0;
end;

procedure InitializeWizard();
begin
  DefaultCode := GetCmdLineParam('CODE', '');
  DefaultApi  := GetCmdLineParam('API',  '{#MyDefaultApiBase}');
  HasExistingEnrollment := DetectExistingEnrollment();

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

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  // On upgrade re-install, the machine is already enrolled — no new code needed.
  if (PageID = CodePage.ID) and HasExistingEnrollment and (Trim(DefaultCode) = '') then
    Result := True;
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

function JsonEscape(Value: String): String;
begin
  Result := Value;
  StringChangeEx(Result, '\', '\\', True);
  StringChangeEx(Result, '"', '\"', True);
end;

procedure WriteWraythConfig();
var
  ConfigJson, ConfigPath: String;
begin
  // On upgrade: the existing config already carries the device_token that ties
  // this machine to its server-side row. Overwriting it would drop the token
  // and force a fresh enrollment, which would create a duplicate device.
  if HasExistingEnrollment and (Trim(GetEnrollmentCode('')) = '') then
    Exit;

  ConfigPath := ExpandConstant('{commonappdata}\Wrayth\wrayth-config.json');
  ConfigJson :=
    '{' + #13#10 +
    '  "enrollment_code": "' + JsonEscape(GetEnrollmentCode('')) + '",' + #13#10 +
    '  "api_base": "' + JsonEscape(GetApiBase('')) + '"' + #13#10 +
    '}';

  if not SaveStringToFile(ConfigPath, ConfigJson, False) then
  begin
    RaiseException('Wrayth setup could not write the enrollment config to ' + ConfigPath + '. Run the installer as administrator and try again.');
  end;
end;

procedure RegisterWraythService();
var
  ResultCode: Integer;
  Params, LogPath: String;
begin
  LogPath := ExpandConstant('{commonappdata}\Wrayth\logs\install.log');
  WizardForm.StatusLabel.Caption := 'Registering Wrayth service...';
  WriteWraythConfig();

  Params :=
    '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\install-wrayth-service.ps1') + '"' +
    ' -ServiceName "{#MyServiceName}"' +
    ' -DisplayName "{#MyServiceDisplay}"' +
    ' -Description "Reports device security posture to Wrayth and executes approved actions."' +
    ' -AppDir "' + ExpandConstant('{app}') + '"';

  if not Exec('powershell.exe', Params, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    RaiseException('Wrayth setup could not launch PowerShell to register the Windows service.');
  end;

  if ResultCode = 3010 then
  begin
    WraythRestartRequired := True;
    RaiseException('Windows has the Wrayth service pending deletion. Reboot Windows, then run WraythSetup.exe again with a fresh enrollment code. Details: ' + LogPath);
  end;

  if ResultCode <> 0 then
  begin
    RaiseException('Wrayth setup could not register the Windows service. Details were written to ' + LogPath + '. Exit code: ' + IntToStr(ResultCode));
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    RegisterWraythService();
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = CodePage.ID then
  begin
    // Existing enrollment? The code field is optional — we'll keep the current token.
    if (Trim(CodePage.Values[0]) = '') and (not HasExistingEnrollment) then
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
