import { Framework } from '../base'
import { LanguageId } from '../../utils'

class ReactFramework extends Framework {
  id= 'react'
  display= 'React'

  detection= {
    packageJSON: [
      'react-i18next',
      'react-intl',
      'next-i18next',
    ],
  }

  languageIds: LanguageId[] = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'ejs',
  ]

  // for visualize the regex, you can use https://regexper.com/
  keyMatchReg = [
    // general jsx attrs
    '[^\\w\\d](?:Trans[ (]i18nKey=|FormattedMessage[ (]id=|t\\(\\s*)[\'"`]({key})[\'"`]',
    // useIntl() hooks, https://github.com/formatjs/react-intl/blob/master/docs/API.md#useintl-hook
    '[^\\w\\d](?:formatPlural|formatNumber|formatDate|formatTime|formatHTMLMessage|formatMessage|formatRelativeTime)\\(.*?[\'"`]?id[\'"`]?:\\s*[\'"`]({key})[\'"`]',
  ]

  refactorTemplates(keypath: string) {
    return [
      `{t('${keypath}')}`,
      `t('${keypath}')`,
      keypath,
    ]
  }
}

export default ReactFramework
