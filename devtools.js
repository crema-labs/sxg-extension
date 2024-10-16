chrome.devtools.panels.elements.createSidebarPane(
    "Verifier",
    function (sidebar) {
        let currentElement = "None";
        chrome.runtime.onMessage.addListener(function (
            message,
            sender,
            sendResponse
        ) {
            if (message.message.action === "status") {
                console.log(message.message);
                sidebar.setObject({
                    selected_element: currentElement,
                    status: message.message.status,
                    ...(message.message.trackingId
                        ? { trackingId: message.message.trackingId }
                        : {}),
                    ...(message.message.proof
                        ? { proof: message.message.proof }
                        : {}),
                });
            }

            if (message.message.action === "error") {
                sidebar.setObject({
                    error: "Please try another element",
                });
            }
        });

        chrome.devtools.panels.elements.onSelectionChanged.addListener(
            async () => {
                chrome.devtools.inspectedWindow.eval(
                    "[$0.outerHTML, window.location.href]",
                    function (result, isException) {
                        if (isException) {
                            console.error(
                                "Error retrieving selected element:",
                                isException
                            );
                            sidebar.setObject({
                                error: "Error retrieving element",
                            });
                        } else {
                            currentElement = result[0];
                            sidebar.setObject({
                                selected_element:
                                    result[0] || "No outerHTML available",
                            });
                            chrome.runtime.sendMessage(
                                {
                                    action: "sendData",
                                    data: {
                                        html: result[0],
                                        url: result[1],
                                    },
                                },
                                function (response) {
                                    console.log(
                                        "Response from background script:",
                                        response
                                    );
                                }
                            );
                        }
                    }
                );
            }
        );
    }
);
