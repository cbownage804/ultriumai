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
; Write the config file (enrollment_code + api_base) collected in the wizard.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$c = @{{ enrollment_code = '{code:GetEnrollmentCode}'; api_base = '{code:GetApiBase}' }} | ConvertTo-Json; Set-Content -Path 'C:\ProgramData\Wrayth\wrayth-config.json' -Value $c -Encoding UTF8"""; \
  Flags: runhidden; StatusMsg: "Writing enrollment config..."

; Register (or refresh) the WinSW-managed service in a single PowerShell
; step. This avoids the classic "service marked for deletion" trap that
; happens when sc.exe delete is called while Services.msc holds a handle.
; If the service already exists, we just stop it and refresh its config
; instead of deleting and reinstalling.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$svc = Get-Service -Name '{#MyServiceName}' -ErrorAction SilentlyContinue; if ($svc) {{ try {{ Stop-Service -Name '{#MyServiceName}' -Force -ErrorAction SilentlyContinue }} catch {{}}; & '{app}\WraythService.exe' refresh | Out-Null }} else {{ & '{app}\WraythService.exe' install | Out-Null }}; Start-Sleep -Seconds 2; & '{app}\WraythService.exe' start | Out-Null"""; \
  Flags: runhidden waituntilterminated; StatusMsg: "Registering Wrayth service..."

[UninstallRun]
Filename: "{app}\WraythService.exe"; Parameters: "stop";      Flags: runhidden waituntilterminated; RunOnceId: "StopWraythSvc"
Filename: "{app}\WraythService.exe"; Parameters: "uninstall"; Flags: runhidden waituntilterminated; RunOnceId: "UninstWraythSvc"
Filename: "sc.exe"; Parameters: "delete {#MyServiceName}";    Flags: runhidden waituntilterminated; RunOnceId: "DelWraythSvc"

[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\Wrayth"

[Code]
var
  CodePage: TInputQueryWizardPage;
  DefaultCode: String;
  DefaultApi:  String;

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
