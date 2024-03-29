(function() {
  'use strict';

  angular.module('app')
  .factory('IPResolverService', IPResolverService);

  IPResolverService.$inject = ['$q'];

  function IPResolverService($q) {
    var deferred = $q.defer();
    //get the IP addresses associated with an account
    function getIPs(){
      var ip_dups = {};

      //compatibility for firefox and chrome
      var RTCPeerConnection = window.RTCPeerConnection
        || window.mozRTCPeerConnection
        || window.webkitRTCPeerConnection;
      var useWebKit = !!window.webkitRTCPeerConnection;

      //bypass naive webrtc blocking using an iframe
      if(!RTCPeerConnection){
        var win = iframe.contentWindow;
        RTCPeerConnection = win.RTCPeerConnection
        || win.mozRTCPeerConnection
        || win.webkitRTCPeerConnection;
        useWebKit = !!win.webkitRTCPeerConnection;
      }

      //minimal requirements for data connection
      var mediaConstraints = {
        optional: [{RtpDataChannels: true}]
      };

      var servers = undefined;

      //add same stun server for chrome
      if(useWebKit)
        servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

      //construct a new RTCPeerConnection
      var pc = new RTCPeerConnection(servers, mediaConstraints);

      function handleCandidate(candidate){
        //match just the IP address
        var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        var ip_addrs = ip_regex.exec(candidate);
        if (ip_addrs && typeof ip_addrs[0] !== 'undefined') {
          var ip_addr = ip_regex.exec(candidate)[1];

          ip_dups[ip_addr] = true;
        }
      }

      //listen for candidate events
      pc.onicecandidate = function(ice){

        //skip non-candidate events
        //skip non-candidate events
        if(ice.candidate){

            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
            if(ip_regex.exec(ice.candidate.candidate)){
              var ip_addr = ip_regex.exec(ice.candidate.candidate)[1];

              //remove duplicates
              if(ip_dups[ip_addr] === undefined)
                  deferred.resolve(ip_addr);

              ip_dups[ip_addr] = true;
            }
        }
      };

      //create a bogus data channel
      pc.createDataChannel("");

      //create an offer sdp
      pc.createOffer(function(result){

        //trigger the stun server request
        pc.setLocalDescription(result, function(){}, function(){});

      }, function(){});

      return deferred.promise;
    }

    return {
      resolve: function() {
        return getIPs();
      }
    }
  }
})();
