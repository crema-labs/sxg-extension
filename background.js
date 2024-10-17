let isProcessing = false;
let baseUrl = "http://10.10.11.6:8080/";
let postDataUrl = baseUrl + "proof";
let checkStatusUrl = baseUrl + "status";
let counter = 0;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "sendData") {
        counter++;
        const url = message.data.url;
        const html = message.data.html;

        console.log("isProcessing", isProcessing);
        sendResponse(!isProcessing);
        if (isProcessing) return;

        isProcessing = true;

        const bodyJson = {
            source_url: url,
            data: html,
        };

        try {
            const request = new Request(postDataUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyJson),
            });

            const result = await fetch(request);
            const data = await result.json();
            const id = data.reqId;

            console.log(data);
            console.log("id", id);

            if (typeof data.error === "string") {
                chrome.runtime.sendMessage({
                    target: "devtools",
                    message: {
                        action: "error",
                    },
                });
                isProcessing = false;
                return;
            }

            while (true) {
                let urlSearchParams = new URLSearchParams({
                    reqId: id,
                });
                const request = new Request(
                    checkStatusUrl + "?" + urlSearchParams,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const response = await fetch(request);
                const data = await response.json();

                console.log(data);

                let status = data.status;
                let trackingId = data.tracking_id;

                chrome.runtime.sendMessage({
                    target: "devtools",
                    message: {
                        action: "status",
                        status,
                        trackingId,
                        ...(data.proof ? { proof: data.proof } : {}),
                    },
                });

                if (status === "completed") break;

                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } catch (e) {
            console.log(e);
        }

        isProcessing = false;
    }
});
