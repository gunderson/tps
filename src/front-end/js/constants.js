    // colors for moments
    var moment_colors = {
    yellow: {color: '#FFD217', name: 'yellow'},
    orange: {color: '#FF7900', name: 'orange'},
    pink: {color: '#FF3F72', name: 'pink'},
    purple: {color: '#7A18F9', name: 'purple'},
    teal: {color: '#13D8C7', name: 'teal'},
    blue: {color: '#0090FF', name: 'blue'},
    };

module.exports = {
    loadConfig: function(callback){
        // loads config file to override variables
        $.get('data/client-config.json').done(function(res){

            if(typeof res == 'string') res = JSON.parse(res);
            // console.log('config', res);
            for(var i in res){
                E[i] = res[i];
            }
            callback();

        }).fail(function(){

            // lots of stuff won't work, but at least we can see the site...
            callback();
            console.error('failed to load config');

        });
    },

    // defined in data/client-config.json
    //SITE_ROOT: location.origin + location.pathname,
    //API_ROOT: "http://208.43.113.156/api/", // IBM
    //SOCKET_ROOT: "http://208.43.113.156:80/", // IBM

    KEY_ACE: "ACE",
    KEY_DOUBLE_FAULT: "DOUBLE_FAULT",
    KEY_BREAK_POINT: "BREAK_POINT",
    KEY_GAME_POINT: "GAME_POINT",
    KEY_SET_POINT: "SET_POINT",
    KEY_MATCH_POINT: "MATCH_POINT",

    /////////////////////////
    // controller event names
    /////////////////////////

    EVT_KEY: "EVT_KEY", // KeyView: change key

    MATCH_OVERLAY: "MATCH_OVERLAY", // show match overlay
    // match overlay types
    MATCH_OVERLAY_SHARE: "share",
    MATCH_OVERLAY_DATA: "data",
    MATCH_OVERLAY_TRACK: "track",
    MATCH_OVERLAY_POINT_SHARE: "point-share",
    MATCH_OVERLAY_POINT_DETAIL: "point-detail",
    MATCH_OVERLAY_CLOSED: "overlay-closed", // when overlay closes itself

    //////////////////////////

    //colors for match visualizer
    VIZ_COLORS: ["0x00b2ef", "0xf04e37", "0x00a6a0", "0xee3d96", "0xab1a86", "0x8cc63f", "0xd9182D", "0xfdb813", "0x15d288", "0x008abf", "0xf19027", "0x7c17f9" ,"0xFFFFFF"],

    //POINT_NAMES: ["00", "15", "30", "40", "AD"],

    // moment names are ordered from most to least important
    MOMENT_NAMES: ["MATCH", "SET", "GAME", "DEUCE", "ADVANTAGE", "BREAK POINT", "ACE", "DOUBLE FAULT", "POINT"],
    FLAG_NAMES: ["isMatchPoint", "isSetPoint", "isGamePoint", "isDeuce", "isAdvantage", "isBreakPoint", "isAce", "isDoubleFault", "isPoint"],

    COLORS: moment_colors,
    COLOR_PAIRS: [
        [moment_colors.yellow,  moment_colors.orange],
        [moment_colors.yellow,  moment_colors.pink],
        [moment_colors.yellow,  moment_colors.purple],
        [moment_colors.yellow,  moment_colors.teal],
        [moment_colors.yellow,  moment_colors.blue],
        [moment_colors.orange,  moment_colors.purple],
        [moment_colors.orange,  moment_colors.teal],
        [moment_colors.orange,  moment_colors.blue],
        [moment_colors.pink,    moment_colors.purple],
        [moment_colors.pink,    moment_colors.teal],
        [moment_colors.pink,    moment_colors.blue],
        [moment_colors.purple,  moment_colors.teal],
        [moment_colors.purple,  moment_colors.blue],
        [moment_colors.teal,    moment_colors.blue],
    ],

    EASE_SPRING: [0.175, 0.885, 0, 1.31],
    EASE_SPRING_MINI: [0.18,0.81,0.23,1.39]
};