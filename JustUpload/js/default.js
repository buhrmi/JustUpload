// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;

	function fail(reason) {
	    document.getElementById("loading").innerText = reason;
	}

	function setResourceMapURL(streamReference, imageElement) {
	    if (streamReference) {
	        streamReference.openReadAsync().done(function (imageStream) {
	            if (imageStream) {
	                var url = URL.createObjectURL(imageStream, { oneTimeOnly: true });
	                imageElement.src = url;
	            }
	        }, function (e) {
	            imageElement.alt = "Failed to load";
	        });
	    }
	}

	function uploadStreamReference(streamReference, operation) {
	    streamReference.openReadAsync().then(function (imageStream) {
	        var client = new Windows.Web.Http.HttpClient();
	        var url  = "https://api.imgur.com/3/image";
	        var content = new Windows.Web.Http.HttpMultipartFormDataContent();
	        var imageContent = new Windows.Web.Http.HttpStreamContent(imageStream);
	        content.add(imageContent, "image");
	        client.defaultRequestHeaders.append("Authorization", "Client-ID 4243e1152f66026");
	        client.postAsync(new Windows.Foundation.Uri(url), content).then(function (response) {
	            response.content.readAsStringAsync().then(function (responseString) {
	                response = JSON.parse(responseString);
	                url = response.data.link;
	                var dp = new Windows.ApplicationModel.DataTransfer.DataPackage();
	                dp.setText(url);
	                Windows.ApplicationModel.DataTransfer.Clipboard.setContent(dp);
	                document.getElementById('loading').innerText = "Link copied to clipboard:";
	                document.getElementById('resultLink').href = url;
	                document.getElementById('resultLink').innerText = url;
	                //operation.reportCompleted();
	            });
	        });

	    });

	}


	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize your application here.
			} else {
				// TODO: This application was suspended and then terminated.
				// To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
			}

			

			args.setPromise(WinJS.UI.processAll());
		}
	    if (args.detail.kind == activation.ActivationKind.shareTarget) {
	        var operation = args.detail.shareOperation;
	        var data = operation.data;
	        var iFrame = document.getElementById("shareContentIframe");
	        if (data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.bitmap)) {
	            operation.data.getBitmapAsync().then(function (bitmapStreamReference) {
	                uploadStreamReference(bitmapStreamReference, operation);
	            });
	        }
	        else if (data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.html)) {
	            operation.data.getHtmlFormatAsync().then(function (html) {
	                if (html !== null) {
	                    var htmlFragment = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.getStaticFragment(html);
	                    iFrame.contentDocument.documentElement.innerHTML = htmlFragment;
	                }
	                var images = iFrame.contentDocument.documentElement.getElementsByTagName("img");
	                if (images.length > 0) {
	                    operation.data.getResourceMapAsync().done(function (resourceMap) {
	                        if (resourceMap.size > 0) {
	                            var streamReference = resourceMap[images[0].getAttribute("src")];
	                            if (streamReference) {
	                                setResourceMapURL(streamReference, images[0]);
	                                uploadStreamReference(streamReference, operation);
	                            }
	                            else fail("Share failed");
	                        }
	                        else fail("Share failed");
	                    });
	                }
	                else fail("No image found in share content.");
	            });


	        }
	        else if (data.contains("Shell IDList Array")) {
	            operation.data.getDataAsync("Shell IDList Array").then(function (data) {
	                var path = data[0].path;
	                Windows.Storage.StorageFile.getFileFromPathAsync(data[0].path).then(function (file) {
	                    var streamReference = new Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(file);
	                    uploadStreamReference(streamReference, operation);
	                }, function (error) {
	                    error;
	                })
   	            })
	        }
            else fail("Can't share! Unsupported format.")
	        
	    
	    }
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
		// You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
		// If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
	};

	app.start();
})();
