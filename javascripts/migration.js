(async () => {
    console.log("%s data migration. localStorage =",
                new Date(Date.now()).toISOString(),
                JSON.parse(JSON.stringify(localStorage)));

    let resp;
    if (localStorage.proxySetting != undefined) {
        auth = JSON.parse(localStorage.proxySetting).auth;
        if (auth.user != '' || auth.pass != '') {
            resp = chrome.runtime.sendMessage({ action: 'authUpdate', data: auth });
        }
    }
    await resp;

    chrome.runtime.sendMessage({ action: 'migrationDone' });
})();
