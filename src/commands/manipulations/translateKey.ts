import { window } from 'vscode'
import { LocaleTreeItem, ProgressSubmenuItem } from '../../views'
import { getNodeOrRecord, CommandOptions, getNode } from './common'
import { Translator, CurrentFile, Config, Global, LocaleNode, AccaptableTranslateItem } from '~/core'
import i18n from '~/i18n'

export async function promptForSourceLocale(defaultLocale: string, node?: LocaleNode, to?: string) {
  const locales = Global.allLocales
  const placeHolder = i18n.t('prompt.select_source_language_for_translating', defaultLocale)

  const result = await window.showQuickPick(locales
    .map(locale => ({
      label: locale,
      description: node?.getValue(locale),
    })), {
    placeHolder,
  })

  if (result == null)
    return undefined

  return result.label || defaultLocale
}

export async function TranslateKeys(item?: LocaleTreeItem | ProgressSubmenuItem | CommandOptions) {
  let source: string | undefined

  if (item && !(item instanceof LocaleTreeItem) && !(item instanceof ProgressSubmenuItem) && item.from) {
    source = item.from
  }
  else {
    const node = getNode(item)

    source = Config.sourceLanguage
    if (Config.translatePromptSource)
      source = await promptForSourceLocale(source, node)

    if (source == null)
      return
  }

  let nodes: AccaptableTranslateItem[] = []
  let targetLocales: string[] | undefined

  if (item instanceof ProgressSubmenuItem) {
    const to = item.node.locale
    nodes = item.getKeys()
      .map(key => CurrentFile.loader.getRecordByKey(key, to, true)!)
      .filter(i => i)
  }
  else {
    if (item instanceof LocaleTreeItem)
      targetLocales = item.listedLocales
    else
      targetLocales = item?.locales

    const node = getNodeOrRecord(item)
    if (node)
      nodes.push(node)
  }

  Translator.translateNodes(CurrentFile.loader, nodes, source, targetLocales)
}
