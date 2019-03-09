import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "protobuf-helper" is now active!');

	//enum not supported
	let generator = vscode.commands.registerTextEditorCommand('extension.resetFieldID', (editor, editorEdit) => {
		function GenerateFieldID(text: string) {
			let result = "";
			let s_cmt = false;
			let m_cmt = false;

			let message_stack = [];
			let message_begin = false;

			let id_stack = [];
			let id_begin = false;
			let next_id = 1;

			for (var i = 0; i < text.length; i++) {
				let char0 = text.charAt(i);
				let char1 = (i+1 < text.length) ? text.charAt(i+1) : '\0';
				let next_char = false;

				if (s_cmt && char0 === '\n') {
					s_cmt = false;
				} else if (m_cmt && char0 === '*' && char1 === '/') {
					m_cmt = false;
					next_char = true;
				} else if (s_cmt || m_cmt) {
				} else if (char0 === '/' && char1 === '/') {
					s_cmt = true;
					next_char = true;
				} else if (char0 === '/' && char1 === '*') {
					m_cmt = true;
					next_char = true;
				} else {
					if (char0 === '{') {
						id_stack.push(next_id);
						next_id = 1;

						message_begin = true;
						message_stack.push(message_begin);
					} else if (char0 === '}') {
						next_id = id_stack[id_stack.length-1];
						id_stack.pop();

						message_begin = message_stack[message_stack.length-1];
						message_stack.pop();
					} else if (message_begin) {
						if (char0 === '=') {
							id_begin = true;
						} else if (id_begin && char0 !== ';') {
							continue;
						} else if (id_begin && char0 === ';') {
							result += " " + next_id + ";";
							id_begin = false;
							next_id++;
							continue;
						}
					}
				}

				result += char0;
				if (next_char) {
					result += char1;
					i++;
				}
			}

			return result;
		}

		let fullText = editor.document.getText();
		const fullRange = new vscode.Range(
			editor.document.positionAt(0),
			editor.document.positionAt(fullText.length)
		);
		editor.edit(edit => edit.replace(fullRange, GenerateFieldID(fullText)));
		//editor.document.save();
	});

	context.subscriptions.push(generator);
}

export function deactivate() {}
