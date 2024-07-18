
// --------------- import ---------------
import { localStorageFile } from "./storage.js";
import { lockNoti } from "./kabu.js";
// --------------- declaration ---------------
var clientId = 'knh3uz2mx2hp2eu';
var clientSecret = 'nwb3dnfh09rhs31';
// --------------- initialization ---------------
let Module = null;
window.addEventListener("gbaInitialized", (event) => {
    Module = event.detail.Module;
});
// --------------- function ---------------
function authorizeWithDropbox() {
    var redirectUri = window.location.href.split('?')[0];
    var responseType = 'code';
    var tokenAccessType = 'offline';
    var authorizeUrl = 'https://www.dropbox.com/oauth2/authorize?client_id=' + clientId + '&response_type=' + responseType + '&token_access_type=' + tokenAccessType + '&redirect_uri=' + encodeURIComponent(redirectUri);
    window.location.href = authorizeUrl;
}
function handleDropboxCallback() {
    var authorizationCode = getUrlParameter('code');
    if (authorizationCode) {
        getAccessToken(authorizationCode);
        console.log("Authorization Code:",authorizationCode)
    } else {
        console.log("Do not receive authorization")
    }
}
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&#]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
function getAccessToken(authorizationCode) {
    var grantType = 'authorization_code';
    var redirectUri = window.location.href.split('?')[0];
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.dropbox.com/oauth2/token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var accessToken = response.access_token;
            var refreshToken = response.refresh_token;
            var uId = response.uid;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("uId", uId);
           // window.location.href = redirectUri;           
        } else {
            console.log("Do not receive access token & refresh token")
        }
    };
    xhr.send('code=' + authorizationCode + '&grant_type=' + grantType + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&redirect_uri=' + encodeURIComponent(redirectUri));
}
async function dpRefreshToken() {
	if (!(localStorage.getItem("refreshToken"))) {
		throw "No refresh token";
	}
	try {
		const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `refresh_token=${localStorage.getItem("refreshToken")}&grant_type=refresh_token&client_id=knh3uz2mx2hp2eu&client_secret=nwb3dnfh09rhs31`
		});

		const data = await response.json();
		if (!data.error) {
			localStorage.setItem("accessToken", data.access_token);
            await lockNoti("", "Refreshing token...", 3000)
            await delay(1000);
			return true;
		} else {
			alert(data.error_description || "Failed to refresh Dropbox token.");
		}
	} catch (error) {
		console.error("Error while refreshing token:", error);
	}

	return false;
}
async function dpUploadFile(fileName, fileData) {
    const uId = localStorage.getItem("uId");
	var uploadArg = JSON.stringify({
		"autorename": true,
		"mode": 'overwrite',
		"mute": true,
		"strict_conflict": false,
		"path": '/' + uId + '/' + fileName,
	})
	var blob = new Blob([fileData], {
		type: "application/octet-stream"
	})
	for (var retry = 0; retry < 2; retry++) {
		var resp = await fetch('https://content.dropboxapi.com/2/files/upload', {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
				'Dropbox-API-Arg': uploadArg,
				'Content-Type': 'application/octet-stream'
			},
			body: blob
		})
		if (resp.status != 200) {
			if (resp.status == 401) {
				var ret = await dpRefreshToken()
				if (!ret) {
					throw "Unable to refresh token"
				}
				continue
			} else {
				throw "Upload failed, unknown http status: " + resp.status
			}
		} else {
			var obj = await resp.json()
            console.log("Kabu storage ↦ Cloud ◆", fileName);
			return obj
		}
	}
	return false
}
async function dpDownloadFile(fileName) {
    const uId = localStorage.getItem("uId");
    var downloadArg = JSON.stringify({"path": '/' + uId + '/' + fileName});
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Dropbox-API-Arg": downloadArg,
            }
        });
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken();
                if (!ret) {
                    throw "Unable to refresh token";
                }
                continue;
            } else {
                throw "Download failed, unknown http status:" + resp.status;
            }
        }

        const file = new File([await resp.blob()], fileName);
        console.log("Cloud ↦ Kabu storage ◆", file.name);
        if (fileName.endsWith(".txt")) {
            const textContent = await file.text();
            const [img, date] = textContent.split("\n\n");
            const gameName = fileName.substring(0, fileName.lastIndexOf("gba") + 3);
            const slotNumber = fileName.charAt(fileName.length - 5);
            localStorage.setItem(`${gameName}_dateState${slotNumber}`, date);
            localStorage.setItem(`${gameName}_imageState${slotNumber}`, img);
        } else {
            Module.uploadSaveOrSaveState(file, () => {
                localStorageFile();
                Module.FSSync();
            });
        }
        return file;
    }

    return false;
}
// --------------- processing ---------------
document.addEventListener("DOMContentLoaded", function() {
dropboxRestore.addEventListener("click", async function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        window.alert("Cloud login required!");
    } else {
        var requestData = {
            path: '/' + uId
        };
        for (var retry = 0; retry < 2; retry++) {
            var resp = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            console.log("status: ", resp.status);
            if (resp.status != 200) {
                if (resp.status == 401) {
                    var ret = await dpRefreshToken();
                    if (!ret) {
                        throw "Unable to refresh token";
                    }
                    continue;
                } else {
                    throw "Download failed, unknown http status: " + resp.status;
                }
            } else {
                const data = await resp.json();
                const totalFiles = data.entries.filter(entry => entry[".tag"] === "file").length;
                const confirmMessage = `Do you want to restore ${totalFiles} files in Cloud?`;
                if (window.confirm(confirmMessage)) {
                    for (const entry of data.entries) {
                        if (entry[".tag"] === "file") {
                            await lockNoti("Restoring...", entry.name, 3000)
                            await dpDownloadFile(entry.name);
                        }
                    }
                } else {
                    console.log("Restore canceled by user.");
                }
                return true;
            }
        }
        return false;
    }
});
dropboxBackup.addEventListener("click", async function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        window.alert("Cloud login required!");
    } else {
        const directories = ["states", "saves"];
        let totalFilesUploaded = 0;
        for (const directory of directories) {
            const fileList = Module[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]().filter(
                (file) => file !== "." && file !== ".."
            );
            totalFilesUploaded += fileList.length;
        }
        if (window.confirm(`Do you want to backup ${totalFilesUploaded} files in Kabu?`)) {
            for (const directory of directories) {
                const fileList = Module[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]().filter(
                    (file) => file !== "." && file !== ".."
                );
                for (const fileName of fileList) {
                    const fileData = await Module.downloadFile(`/data/${directory}/${fileName}`);
                    try {
                        await lockNoti("Backing up...", fileName, 3000)
                        await dpUploadFile(fileName, fileData);
                        if (fileName.endsWith(".ss0") || fileName.endsWith(".ss1") || fileName.endsWith(".ss2") || fileName.endsWith(".ss3") || fileName.endsWith(".ss4") || fileName.endsWith(".ss5") || fileName.endsWith(".ss6") || fileName.endsWith(".ss7") ) {
                            const gameName = fileName.substring(0, fileName.lastIndexOf('.'));
                            const slotNumber = fileName.charAt(fileName.length - 1);
                            const img = localStorage.getItem(`${gameName}.gba_imageState${slotNumber}`);
                            const date = localStorage.getItem(`${gameName}.gba_dateState${slotNumber}`);
                            if (img !== null) {
                                const textContent = `${img}\n\n${date}`;
                                const blob = new Blob([textContent], { type: "text/plain" });
                                await lockNoti("Backing up...", `${gameName}.gba_slot${slotNumber}.txt`, 3000)
                                await dpUploadFile(`${gameName}.gba_slot${slotNumber}.txt`, blob); 
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to upload file ${fileName}:`, error);
                    }
                }
            }
        } else {
            console.log("Restore canceled by user.");
        }
    }
});
dropboxCloud.addEventListener("click", function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        authorizeWithDropbox();
    } else {
        if (window.confirm(`Do you want to logout?`)) {
            localStorage.setItem("uId", "");
            dropboxRestore.classList.remove("active");
            dropboxBackup.classList.remove("active");
            dropboxCloud.classList.remove("active");
        }
    }
});
handleDropboxCallback();
});