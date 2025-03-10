import * as Main from './main.js';
import { localStorageFile } from "./storage.js";
/* --------------- Declaration --------------- */
var clientId = 'knh3uz2mx2hp2eu';
var clientSecret = 'nwb3dnfh09rhs31';
/* --------------- Function ------------------ */
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
export async function dpCreateFolder(folderPath) {
    const uId = localStorage.getItem("uId");
    let accessToken = localStorage.getItem("accessToken");
    const fullPath = `/${uId}/${folderPath}`;
    const requestBody = JSON.stringify({
        "path": fullPath,
        "autorename": false
    });
    for (let retry = 0; retry < 2; retry++) {
        try {
            const resp = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });
            if (resp.status === 401) { 
                const ret = await dpRefreshToken();
                if (!ret) throw new Error("Unable to refresh token");
                accessToken = localStorage.getItem("accessToken");
                continue;
            }
            if (resp.status === 409) {
                return { message: "Folder already exists", path: folderPath };
            }
            if (!resp.ok) {
                throw new Error(`Error creating folder ${folderPath}`);
            }
            const obj = await resp.json();
            await lockNoti("Folder created", "", 3000);
            return obj;
        } catch (error) {
            if (retry === 1) throw error;
        }
    }

    return false;
}
export async function dpRefreshToken() {
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
            await lockNoti("Refreshing token...", "", 3000)
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
export async function dpUploadFile(fileName, fileData, folderDB) {
    const uId = localStorage.getItem("uId");
	var uploadArg = JSON.stringify({
		"autorename": true,
		"mode": 'overwrite',
		"mute": true,
		"strict_conflict": false,
		"path": '/' + uId + '/' + folderDB +'/' + fileName,
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
export async function dpDownloadFile(fileName, folderDB) {
    const uId = localStorage.getItem("uId");
    var downloadArg = JSON.stringify({"path": '/' + uId + '/' + folderDB +  '/' + fileName});
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
            Main.uploadFileInCloud(file, () => {});
        return file;
    }
    return false;
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    dropboxRestore.addEventListener("click", async function () {
        await lockNoti("Wait a little bit...", "", 5000);
        const uId = localStorage.getItem("uId");
        const directories = ["state", "save", "screenshot"];
        if (!uId) {
            window.alert("Cloud login required!");
            return;
        }
        let allFiles = []
        for (const folderPath of directories) {
            let requestData = {
                path: '/' + uId + '/' + folderPath
            };
            for (let retry = 0; retry < 2; retry++) {
                let resp = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
                    method: 'POST',
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                if (resp.status === 200) {
                    let data = await resp.json();
                    let files = data.entries.filter(entry => entry[".tag"] === "file");
    
                    if (files.length > 0) {
                        allFiles.push(...files.map(file => ({ name: file.name, folder: folderPath })));
                    }
                    break;
                } else if (resp.status === 401) {
                    let ret = await dpRefreshToken();
                    if (!ret) throw "Unable to refresh token";
                } else {
                    console.error(`Download failed for ${folderPath}, status: ${resp.status}`);
                    break;
                }
            }
        }
        if (allFiles.length > 0) {
            const confirmMessage = `Do you want to restore ${allFiles.length} files from Cloud?`;
            if (window.confirm(confirmMessage)) {
                for (const file of allFiles) {
                    await lockNoti("Restoring...",file.name,3000);
                    await dpDownloadFile(file.name, file.folder);
                }
            } else {
                console.log("Restore canceled by user.");
            }
        } else {
            console.log("No files found to restore.");
        }
    });
    dropboxBackup.addEventListener("click", async function() {
        await lockNoti("Wait a little bit...", "", 5000);
        const uId = localStorage.getItem("uId");
        if (uId === null || uId === "") {
            window.alert("Cloud login required!");
        } else {
            const directories = ["state", "save", "screenshot"];
            for (const directory of directories) {
                await dpCreateFolder(directory);
            }
            let totalFilesUploaded = 0;
            for (const directory of directories) {
                const fileList = Main[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]();
                totalFilesUploaded += fileList.length;
            }
            if (window.confirm(`Do you want to backup ${totalFilesUploaded} files in Kabu?`)) {
                for (const directory of directories) {
                    const fileList = Main[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]();
                    for (const fileName of fileList) {
                        const fileData = await Main.downloadFileInCloud(`/data/${directory}s/${fileName}`);
                        try {
                            await lockNoti("Backing up...", fileName, 3000)
                            await dpUploadFile(fileName, fileData, directory);
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