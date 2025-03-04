import { app, Menu, Tray, nativeImage } from 'electron'
import { fileURLToPath } from 'url'
import { handleCreateWindow } from './index'
import { SettingsStore } from './Stores/SettingsStore'
import { setFile } from './File/File'
import trayIcon from '../../resources/tray.png?asset'

let tray: Tray

function createMenuTemplate(files: FileObject[]): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: 'Show sleek',
      click: () => {
        handleCreateWindow()
      }
    },
    { type: 'separator' },
    ...(files?.length > 0
      ? files.map((file: FileObject, index: number) => ({
          label: file.todoFileName!,
          accelerator: `CommandOrControl+${index + 1}`,
          click: () => {
            setFile(index)
            handleCreateWindow()
          }
        }))
      : []),
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ]
}

export function handleTray(showTray) {
  tray?.destroy()

  if (!showTray) {
    app.dock?.show()
    return
  }

  const files: FileObject[] = SettingsStore.get('files')
  const menu: Electron.Menu = Menu.buildFromTemplate(createMenuTemplate(files))
  tray = new Tray(nativeImage.createFromPath(trayIcon))
  tray.setToolTip('sleek')
  tray.setContextMenu(menu)
  tray.on('click', () => {
    handleCreateWindow()
  })
}