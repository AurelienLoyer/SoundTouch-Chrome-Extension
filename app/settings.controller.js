angular.module("app").controller("SettingsController", SettingsController);

function SettingsController($http, $q, settingsService, IPResolverService) {
  var vm = this;
  vm.scanProgress = false;
  vm.manually = false;
  vm.ipToTest = "";
  vm.testIpResult = "";
  //Function
  vm.manuallySet = manuallySet;
  vm.testManualIp = testManualIp;
  vm.scanNetwork = scanNetwork;
  vm.selectDevice = selectDevice;
  vm.reset = reset;
  vm.sendEmail = sendEmail;
  vm.testIp = {};
  vm.testIp.progressPourcent = 0;
  vm.testIp.stop = false;
  vm.version = "";

  var ips = [];
  vm.myIp = "";
  if (typeof chrome !== "undefined" && chrome && chrome.storage) {
    var manifest = chrome.runtime.getManifest();
    if (manifest) vm.version = manifest.version;
  }

  function sendEmail() {
    var emailUrl = "mailto:aur.loy@gmail.com";
    if (typeof chrome !== "undefined") {
      chrome.tabs.create({ url: emailUrl }, function (tab) {
        setTimeOut(function () {
          chrome.tabs.remove(tab.id);
        }, 500);
      });
    }
  }

  function reset() {
    settingsService.setDevice(null);
    vm.currentDevice = null;
  }

  function selectDevice(device, index) {
    _gaq.push(["_trackEvent", "Device selected !", "find"]);
    settingsService.setDevice(device);
    vm.noDevice = false;
    vm.testIp.stop = true;
    vm.currentDevice = device;
    vm.devices.splice(index, 1);
  }

  settingsService.getDevice(function (data) {
    console.log(data);
    if (data && data.device) {
      vm.currentDevice = data.device;
    }
  });

  function testIpAdresse(el) {
    return $http.get("http://" + el + ":8090/info", { timeout: 200 });
  }

  function callTest(number) {
    //Soundtouch selected -> stop search ;
    if (vm.testIp.stop) {
      vm.scanProgress = false;
      return;
    }

    vm.testIp.progress = number;
    vm.testIp.progressPourcent = Math.round((number * 100) / 254);
    vm.testIp.ip = ips[number];
    if (number == 254) {
      vm.scanProgress = false;
      if (vm.devices.length == 0) {
        vm.noDevice = true;
        _gaq.push(["_trackEvent", "Device not found", "find"]);
      }
    } else {
      testIpAdresse(ips[number])
        .then(function (response) {
          if (response && response.status == 200) {
            parser = new DOMParser();
            var xmlDoc = parser.parseFromString(response.data, "text/xml");
            var device = {};
            device.myIp = vm.myIp;
            device.name =
              xmlDoc.getElementsByTagName("name")[0].childNodes[0].nodeValue;
            device.type =
              xmlDoc.getElementsByTagName("type")[0].childNodes[0].nodeValue;
            device.ipAddress =
              xmlDoc.getElementsByTagName(
                "ipAddress"
              )[0].childNodes[0].nodeValue;
            _gaq.push(["_trackEvent", device.name, "find"]);
            vm.devices.push(device);
            callTest(number + 1);
          } else if (number != 254) {
            callTest(number + 1);
          }
        })
        .catch(function () {
          if (number != 254) {
            callTest(number + 1);
          }
        });
    }
  }

  function manuallySet() {
    vm.manually = !vm.manually;
  }

  function testManualIp() {
    vm.devices = [];
    if (vm.ipToTest == "") {
      vm.testIpResult = "No ip set !";
    } else if (!ValidateIPaddress(vm.ipToTest)) {
      vm.testIpResult = "Not valid ip set !";
    } else {
      vm.testIpResult = "Test :" + vm.ipToTest;
      testIpAdresse(vm.ipToTest)
        .then(function (response) {
          if (response && response.status == 200) {
            parser = new DOMParser();
            var xmlDoc = parser.parseFromString(response.data, "text/xml");
            var device = {};
            device.name =
              xmlDoc.getElementsByTagName("name")[0].childNodes[0].nodeValue;
            device.type =
              xmlDoc.getElementsByTagName("type")[0].childNodes[0].nodeValue;
            device.ipAddress =
              xmlDoc.getElementsByTagName(
                "ipAddress"
              )[0].childNodes[0].nodeValue;
            _gaq.push(["_trackEvent", device.name, "find"]);
            vm.devices.push(device);
            vm.manually = false;
          } else {
            vm.testIpResult = "No Soundtouch Find !";
          }
        })
        .catch(function () {
          vm.testIpResult = "No Soundtouch Find !";
        });
    }
  }

  function scanNetwork() {
    //Analytics send pushed button
    _gaq.push(["_trackEvent", "Scan Network Button", "clicked"]);

    vm.devices = [];
    vm.scanProgress = true;
    vm.noDevice = false;
    vm.testIp.stop = false;

    IPResolverService.resolve()
      .then(function (ip) {
        console.log(ip);
        vm.myIp = ip;
        _gaq.push(["_trackEvent", ip, "user local ip"]);
        if (ip && ValidateIPaddress(ip)) {
          ip = ip.split(".");
          for (var i = 0; i < 254; i++) {
            var testIp = ip[0] + "." + ip[1] + "." + ip[2] + "." + i;
            ips.push(testIp);
          }
          callTest(0);
        }
      })
      .catch(function (e) {
        console.log("Error");
        console.log(e);
      });
  }

  function ValidateIPaddress(ipaddress) {
    if (
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ipaddress
      )
    ) {
      return true;
    }
    return false;
  }
}
