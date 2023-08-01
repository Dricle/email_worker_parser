const PostalMime = require('postal-mime');

async function streamToArrayBuffer(stream, streamSize) {
	let result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

export default {
	async email(event, env, ctx) {
		const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
		const parser = new PostalMime.default();
		const parsedEmail = await parser.parse(rawEmail);

		console.log("Mail subject: ", parsedEmail.subject);
		console.log("HTML version of Email: ", parsedEmail.html);
		console.log("Text version of Email: ", parsedEmail.text);

        var data = new FormData()
        data.append('from', event.from)
        data.append('to', event.to)
        data.append('subject', parsedEmail.subject)
        data.append('body_html', parsedEmail.html)
        data.append('body_text', parsedEmail.text)
        data.append('attachments_original', parsedEmail.attachments)

		if (parsedEmail.attachments.length == 0) {
			console.log("No attachments");
		} else {
			parsedEmail.attachments.forEach(att => {
                data.append('attachments[]', att, att.filename)
				console.log("Attachment: ", att.filename);
				console.log("Attachment disposition: ", att.disposition);
				console.log("Attachment mime type: ", att.mimeType);
				console.log("Attachment size: ", att.content.byteLength);
			});
		}

        await fetch("https://app.aicustomerservice.com/api/hooks/emails", {
            method: "POST",
            body: data,
            headers: {
                "Content-Type": "application/json",
            }
        })
	},
};
