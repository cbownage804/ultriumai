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
Source: "..\dist\WraythAgent.exe"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{commonappdata}\Wrayth"; Permissions: users-modify

[Run]
; Write the config file (enrollment_code + api_base) collected in the wizard.
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""$c = @{{ enrollment_code = '{code:GetEnrollmentCode}'; api_base = '{code:GetApiBase}' }} | ConvertTo-Json; Set-Content -Path 'C:\ProgramData\Wrayth\wrayth-config.json' -Value $c -Encoding UTF8"""; \
  Flags: runhidden; StatusMsg: "Writing enrollment config..."

; Remove any prior instance of the service (ignore failures).
Filename: "sc.exe"; Parameters: "stop {#MyServiceName}";   Flags: runhidden waituntilterminated; StatusMsg: "Stopping existing service..."
Filename: "sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Removing existing service..."

; Create the service as LocalSystem, auto-start, with restart-on-failure.
Filename: "sc.exe"; \
  Parameters: "create {#MyServiceName} binPath= ""\""{app}\{#MyAppExeName}\"""" start= auto DisplayName= ""{#MyServiceDisplay}"" obj= LocalSystem"; \
  Flags: runhidden waituntilterminated; StatusMsg: "Registering Wrayth service..."
Filename: "sc.exe"; \
  Parameters: "description {#MyServiceName} ""Reports device security posture to Wrayth and executes approved actions."""; \
  Flags: runhidden waituntilterminated
Filename: "sc.exe"; \
  Parameters: "failure {#MyServiceName} reset= 86400 actions= restart/60000/restart/60000/restart/60000"; \
  Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "start {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Starting Wrayth Agent..."

[UninstallRun]
Filename: "sc.exe"; Parameters: "stop {#MyServiceName}";   Flags: runhidden waituntilterminated; RunOnceId: "StopWraythSvc"
Filename: "sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated; RunOnceId: "DelWraythSvc"

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
