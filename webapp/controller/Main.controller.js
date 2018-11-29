sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/List',
	'sap/m/StandardListItem'
], function (Controller, MessageBox, JSONModel, Button, Dialog, List, StandardListItem) {
	"use strict";

	return Controller.extend("com.flexso.HackTheFuture.controller.Main", {

		onInit: function () {
			this.getIotData();
		},

		getIotData: function () {
			// url to get the artifact signals of your device : 
			// '/devices/XX/measures'  -> XX = your device id
			var me = this;
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/devices/105/measures",
					headers: "",
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});

			return Promise.resolve(promise).then(function (result) {
				var da = me.groupData(result);
				me.getView().setModel(new sap.ui.model.json.JSONModel(da), "dataModel");
			});
		},

		groupData: function (iotData) {
			var parsedData = [];
			console.log(iotData);
			for(var i = 0; i < iotData.length; i+=4){
				parsedData.push({
					artifact_id: iotData[i].measure.artifact_id,
					longitude: iotData[i+1].measure.longitude,
					latitude: iotData[i+2].measure.latitude,
					artifact_signal: iotData[i+3].measure.artifact_signal
				});
			};
			console.log(parsedData);
			return {"array":parsedData};
		},

		triggerML: function (oEvent) {
		},

		getMlAuthToken: function () {
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/token?grant_type=client_credentials",
					headers: "",
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});

			return Promise.resolve(promise).then(function (result) {
				return "Bearer " + result.access_token;
			});
		},

		sendToMl: function (token, base64) {
		
			//Use the following format to send to ML (image name can always be 'ArtifactSignal.jpg')
			//image is a variable
			//var formData = new FormData();
			//formData.append("files", image, "ArtifactSignal.jpg");
			
			//url to post on : '/ml-dest/api/v2/image/classification/models/HTF/versions/2'
			var contentType = 'image/jpg';
            var image = this.base64toBlob(base64, contentType);
            var blobUrl = URL.createObjectURL(image);
            var formData = new FormData();
            formData.append("files", image, "ArtifactSignal.jpg");
            var promise = new Promise(function (resolve, reject) {
                $.ajax({
                    type: "POST",
                    url: "/ml-dest/api/v2/image/classification/models/HTF/versions/2",
                    headers: {
                        "Accept": "application/json",
                        "APIKey": token,
                        "Authorization": token
                    },
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (Error) {
                        reject((Error));
                    },
                    contentType: false,
                    async: false,
                    data: formData,
                    cache: false,
                    processData: false
                });
            });
            return Promise.resolve(promise).then(function (result) {
                var obj = {
                    "result": result,
                    "image": blobUrl
                };
                return obj;
            });

			

		},

		base64toBlob: function (b64Data, contentType, sliceSize) {

			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {
				type: contentType
			});
			return blob;
		},
		
		onPress: function(){
			if (!this.pressDialog) {
				this.pressDialog = new Dialog({
					title: 'The artifact',
					content: new Text({text: 'test'}),
					beginButton: new Button({
						text: 'Close',
						press: function () {
							this.pressDialog.close();
						}.bind(this)
					})
				});

				//to get access to the global model
				this.getView().addDependent(this.pressDialog);
			}

			this.pressDialog.open();
		}

	});
	
	
});

