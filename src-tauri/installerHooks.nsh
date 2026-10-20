!macro NSIS_HOOK_POSTINSTALL
  File "C:\Users\Montival Nunes\Desktop\teste arduino\NOVO PROGRAMA\baropress-fase1\baropress\src-tauri\bin_deps\WebView2Loader.dll"
  File "C:\Users\Montival Nunes\Desktop\teste arduino\NOVO PROGRAMA\baropress-fase1\baropress\src-tauri\bin_deps\libunwind.dll"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\libunwind.dll"
!macroend
