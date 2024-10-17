chrome.devtools.panels.elements.createSidebarPane(
    "Verifier",
    function (sidebar) {
        let currentElement = "None";
        let trackingId = "None";
        let proof = "None";
        let verifier =
            "https://sepolia.etherscan.io/address/0xbb6ee4b1b44e3715fa114575f90349186018e338#readContract";
        chrome.runtime.onMessage.addListener(function (
            message,
            sender,
            sendResponse
        ) {
            if (message.message.action === "status") {
                trackingId = message.message.trackingId;
                proof = message.message.proof;
                sidebar.setObject({
                    selected_element: currentElement,
                    status: message.message.status,
                    ...(message.message.trackingId
                        ? { trackingId: message.message.trackingId }
                        : {}),
                    ...(message.message.proof
                        ? { proof: message.message.proof }
                        : {}),
                    verifier,
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
                                    console.log(response);
                                    if (response) currentElement = result[0];
                                    else {
                                        sidebar.setObject({
                                            currentElement,
                                            trackingId,
                                            proof,
                                            verifier,
                                            error: "Please wait until the previous proof finishes",
                                        });
                                    }
                                }
                            );
                        }
                    }
                );
            }
        );
    }
);
