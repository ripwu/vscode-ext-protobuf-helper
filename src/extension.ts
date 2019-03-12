import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "protobuf-helper" is now active!');

	function resetFieldID(text: string) {
		let result = "";
		let s_cmt = false;
		let m_cmt = false;

		let last_word1 = "";
		let last_word2 = "";
		let cur_word = "";

		let option_begin = false;

		let message_stack = [];
		let message_begin = false;

		let id_stack = [];
		let id_begin = false;
		let id_option_begin = false;
		let id_set = false;
		let next_id = 1;

		let string_begin = false;

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
			} else if (string_begin && char0 !== "\"") {
			} else if (char0 === '/' && char1 === '/') {
				s_cmt = true;
				next_char = true;
			} else if (char0 === '/' && char1 === '*') {
				m_cmt = true;
				next_char = true;
			} else if (char0 === "\"") {
				string_begin = !string_begin;
			} else if (char0 === ' ' || char0 === '\t') {
				if (cur_word !== "") {
					last_word2 = last_word1;
					last_word1 = cur_word;
					cur_word = "";

					if (last_word1 === "option") {
						option_begin = true;
					}
				}

				if (id_begin && !id_set) {
					continue;
				}
			} else if (option_begin) {
				if (char0 === ";") {
					option_begin = false;
				}
			} else {
				if (char0 === '{') {
					id_stack.push(next_id);
					next_id = 1;

					message_begin = true;
					message_stack.push(message_begin);

					if (last_word2 === "enum") {
						next_id = 0;
					}
				} else if (char0 === '}') {
					next_id = id_stack[id_stack.length-1];
					id_stack.pop();

					message_begin = message_stack[message_stack.length-1];
					message_stack.pop();
				} else {
					cur_word += char0;

					if (message_begin) {
						if (!id_begin && char0 === '=' && last_word2 !== "option") {
							id_begin = true;
						} else if (id_begin) {
							if (char0 === '[') {
								result += " " + next_id + " ";
								next_id++;

								id_option_begin = true;
								id_set = true;
							} else if (char0 === ']') {
								result += char0;
								id_option_begin = false;
							} else if (char0 === ';') {
								if (!id_set) {
									result += " " + next_id;
									next_id++;
								}

								id_begin = false;
								id_option_begin = false;
								id_set = false;
							}

							if (id_begin && !id_option_begin) {
								continue;
							}
						}
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

	let disposable = vscode.commands.registerTextEditorCommand('extension.resetFieldID', (editor, editorEdit) => {
		let fullText = editor.document.getText();
		let newText = resetFieldID(fullText);

		const fullRange = new vscode.Range(
			editor.document.positionAt(0),
			editor.document.positionAt(fullText.length)
		);
		editor.edit(edit => edit.replace(fullRange, newText));
		//editor.document.save();
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
