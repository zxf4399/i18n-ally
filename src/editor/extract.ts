import { CodeAction, CodeActionContext, CodeActionKind, CodeActionProvider, Command, languages, Range, Selection, TextDocument } from 'vscode'
import { DiagnosticWithDetection, PROBLEM_CODE_HARD_STRING } from './problems'
import { ExtensionModule } from '~/modules'
import { Config, CurrentFile, Global } from '~/core'
import { Commands } from '~/commands'
import i18n from '~/i18n'
import { parseHardString } from '~/extraction/parseHardString'
import { ExtractTextOptions } from '~/commands/extractText'
import { DetectionResult } from '~/core/types'

export function DetectionResultToExtraction(detection: DetectionResult, document: TextDocument): ExtractTextOptions {
  return {
    isDynamic: detection.isDynamic,
    document,
    text: '',
    rawText: detection.text.trim(),
    isInsert: false,
    range: new Range(
      document.positionAt(detection.start),
      document.positionAt(detection.end),
    ),
  }
}

class ExtractProvider implements CodeActionProvider {
  public async provideCodeActions(
    document: TextDocument,
    selection: Range | Selection,
    context: CodeActionContext,
  ): Promise<(Command | CodeAction)[]> {
    if (!Global.enabled)
      return []

    if (!Global.isLanguageIdSupported(document.languageId))
      return []

    const diagnostic = context.diagnostics.find(i => i.code === PROBLEM_CODE_HARD_STRING) as DiagnosticWithDetection | undefined

    // quick fix for hard string problems
    if (diagnostic?.detection) {
      const action = new CodeAction(i18n.t('refactor.extract_text'), CodeActionKind.QuickFix)
      action.command = {
        command: Commands.extract_text,
        title: i18n.t('refactor.extract_text'),
        arguments: [
          DetectionResultToExtraction(diagnostic.detection, document),
          diagnostic.detection,
        ],
      }
      action.diagnostics = [diagnostic]
      action.isPreferred = true
      return [action]
    }

    // user selection context
    if (!(selection instanceof Selection))
      return []

    const result = parseHardString(document.getText(selection), document.languageId)
    if (!result)
      return []

    const { text, args } = result
    const actions: (Command | CodeAction)[] = []

    actions.push({
      command: Commands.extract_text,
      title: i18n.t('refactor.extract_text'),
      arguments: [],
    })

    // Check for existing translations to recommend, convert them to their templates and then to commands, and add the commands to the command array
    CurrentFile.loader.keys
      .map(key => ({
        label: key,
        description: CurrentFile.loader.getValueByKey(key, Config.displayLanguage, 30),
      }))
      .filter(labelDescription => labelDescription.description === text)
      .flatMap(t => Global.interpretRefactorTemplates(t.label, args, document, diagnostic?.detection))
      .map(t => ({
        command: Commands.replace_with,
        title: i18n.t('refactor.replace_with', t),
        arguments: [t],
      }))
      .forEach(c => actions.push(c))

    return actions
  }
}

const m: ExtensionModule = () => {
  return [
    languages.registerCodeActionsProvider(
      '*',
      new ExtractProvider(),
      {
        providedCodeActionKinds: [
          CodeActionKind.QuickFix,
          CodeActionKind.Refactor,
        ],
      },
    ),
  ]
}

export default m
