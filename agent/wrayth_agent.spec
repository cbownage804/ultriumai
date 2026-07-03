# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the Wrayth device agent.
# Produces a single onefile Windows executable: WraythAgent.exe

a = Analysis(
    ['wrayth_agent.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['wrayth_actions'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='WraythAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='installer/favicon.ico',
)

