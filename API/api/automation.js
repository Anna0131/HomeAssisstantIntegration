const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();


const HOME_ASSISTANT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4OTI2YzE0OTI2YzY0ZTBmYWQ5MGJhNDc1YjBkYTM2NiIsImlhdCI6MTcyMjI0MjAwNiwiZXhwIjoyMDM3NjAyMDA2fQ.DfwflG8zTXQOy5QCy_xn1QjPApSSgqKFV4bYNzpyAjY';
const HA_URL = 'http://163.22.17.116:8123';

// 用於帶有身份驗證的 fetch 請求
async function fetchWithAuth(url, options) {
    options.headers = {
        'Authorization': `Bearer ${HOME_ASSISTANT_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };
    console.log(options, url);
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態: ${response.status}`);
    }
    return response.json();
}
// 創建每周定時自動化
async function createWeeklyAutomation(automationConfig,entity_id) {
    try {
        const randomAutomationId = generateUniqueAutomationId(entity_id);
        const response = await fetchWithAuth(`${HA_URL}/api/config/automation/config/${randomAutomationId}`, {
            method: 'POST',
            body: JSON.stringify(automationConfig),
        });

        return response;
    } catch (error) {
        console.error('創建每周定時自動化失敗:', error);
        throw error;
    }
}
// 創建一次性自動化
async function createOneTimeAutomation(automationConfig,entity_id) {
    try {
        const randomAutomationId = generateUniqueAutomationId(entity_id);
        const response = await fetchWithAuth(`${HA_URL}/api/config/automation/config/${randomAutomationId}`, {
            method: 'POST',
            body: JSON.stringify(automationConfig),
        });

        return response;
    } catch (error) {
        console.error('創建自動化失敗:', error);
        throw error;
    }
}
//創建場景
async function createScene(sceneConfig) {
    try {
        const randomAutomationId = generateUniqueAutomationId("scene.");
        const response = await fetchWithAuth(`${HA_URL}/api/config/scene/config/${randomAutomationId}`, {
            method: 'POST',
            body: JSON.stringify(sceneConfig),
        });
        return response;
    }
    catch (error) {
        console.error('創建場景失敗:', error);
        throw error;
    }
}
function generateUniqueAutomationId(entity_id) {
    const timestamp = Date.now(); // 獲取當前時間戳
    const randomNum = Math.floor(Math.random() * 100000); // 生成隨機數
    return `${entity_id}_${timestamp}_${randomNum}`;
}
router.post('/switch', async function(req, res) {
    const { entity_id, state, triggerTime } = req.body;
    //檢查triggerTime格式: HH:MM:SS
    if (entity_id === undefined || state === undefined || triggerTime === undefined) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(triggerTime)) {
        return res.status(400).json({ success: false, message: "無效的時間格式" });
    }

    let Service;
    if (state === 'on') {
        Service = "switch.turn_on";
    } else if (state === 'off') {
        Service = "switch.turn_off";
    } else {
        return res.status(400).json({ success: false, message: "無效的狀態" });
    }

    const automationConfig = {
        alias: `在${triggerTime} ${state === 'on' ? '打開' : '關閉'}插座 `,
        description: `${entity_id}在${triggerTime}${state === 'on' ? '打開' : '關閉'}插座`,
        trigger: {
            platform: "time",
            at: triggerTime
        },
        action: [
            {
                service: Service,
                target: {
                    entity_id: entity_id
                }
            }
        ],
        mode: "single"
    };

    try {
        const result = await createOneTimeAutomation(automationConfig,entity_id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "創建一次性自動化失敗: " + error.message });
    }
});

router.post('/light', async function(req, res) {
    const { entity_id, state, triggerTime } = req.body;
    //檢查triggerTime格式: HH:MM:SS
    if (entity_id === undefined || state === undefined || triggerTime === undefined) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(triggerTime)) {
        return res.status(400).json({ success: false, message: "無效的時間格式" });
    }
    let Service;
    if (state === 'on') {
        Service = "light.turn_on";
    } else if (state === 'off') {
        Service = "light.turn_off";
    } else {
        return res.status(400).json({ success: false, message: "無效的狀態" });
    }
    const automationConfig = {
        alias: `在${triggerTime} ${state === 'on' ? '打開' : '關閉'}燈光`,
        description: `${entity_id}在${triggerTime}${state === 'on' ? '打開' : '關閉'}燈光`,
        trigger: {
            platform: "time",
            at: triggerTime
        },
        action: [
            {
                service: Service,
                target: {
                    entity_id: entity_id,
                    
                }
            }
        ],
        mode: "single"
    };
    try {
        const result = await createOneTimeAutomation(automationConfig,entity_id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "創建一次性自動化失敗: " + error.message });
    }
});

// 將 daysOfWeek 轉換為對應的星期名稱
function getWeekdayNames(daysOfWeek) {
    const weekdayNames = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return daysOfWeek.map(day => weekdayNames[day]).join('、');
}

// 新增每周定時開啟 switch 的路由
router.post('/weekly-switch', async function(req, res) {
    const { entity_id, state, daysOfWeek, triggerTime } = req.body;
    //檢查triggerTime格式: HH:MM:SS
    if (entity_id === undefined || state === undefined || daysOfWeek === undefined || triggerTime === undefined) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(triggerTime)) {
        return res.status(400).json({ success: false, message: "無效的時間格式" });
    }

    // 檢查 daysOfWeek 是否為數組
    if (!Array.isArray(daysOfWeek) || daysOfWeek.some(day => day < 0 || day > 6)) {
        return res.status(400).json({ success: false, message: "無效的天數格式" });
    }

    let Service;
    if (state === 'on') {
        Service = "switch.turn_on";
    } else if (state === 'off') {
        Service = "switch.turn_off";
    } else {
        return res.status(400).json({ success: false, message: "無效的狀態" });
    }

    // const triggers = daysOfWeek.map(day => ({
    //     platform: "time",
    //     at: triggerTime,
    //     weekday: day
    // }));

    const weekdayNames = getWeekdayNames(daysOfWeek);
    const weekdays = daysOfWeek.map(day => {
        switch (day) {
            case 0: return 'sun';
            case 1: return 'mon';
            case 2: return 'tue';
            case 3: return 'wed';
            case 4: return 'thu';
            case 5: return 'fri';
            case 6: return 'sat';
            default: return '';
        }
    });
    const automationConfig = {
        alias: `每周${weekdayNames} ${triggerTime} ${state === 'on' ? '打開' : '關閉'}插座`,
        description: `${entity_id}在每周的${weekdayNames} ${triggerTime} ${state === 'on' ? '打開' : '關閉'}插座`,
        trigger: [
            {
                platform: 'time',
                at: triggerTime
            }
        ],
        condition: [
            {
                condition: 'time',
                weekday: weekdays
            }
        ],
        action: [
            {
                service: Service,
                target: {
                    entity_id: entity_id
                }
            }
        ],
        mode: "single"
    };

    try {
        const result = await createWeeklyAutomation(automationConfig,entity_id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "創建每周定時自動化失敗: " + error.message });
    }
});
// 新增每周定時開啟 light 的路由
router.post('/weekly-light', async function(req, res){
    const { entity_id, state, daysOfWeek, triggerTime } = req.body;
    //檢查triggerTime格式: HH:MM:SS
    // console.log(entity_id, state, daysOfWeek, triggerTime);
    if (entity_id === undefined || state === undefined || daysOfWeek === undefined || triggerTime === undefined) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(triggerTime)) {
        console.log(triggerTime);
        return res.status(400).json({ success: false, message: "無效的時間格式" });
    }

    // 檢查 daysOfWeek 是否為數組
    if (!Array.isArray(daysOfWeek) || daysOfWeek.some(day => day < 0 || day > 6)) {
        return res.status(400).json({ success: false, message: "無效的天數格式" });
    }

    let Service;
    if (state === 'on') {
        Service = "light.turn_on";
    } else if (state === 'off') {
        Service = "light.turn_off";
    } else {
        return res.status(400).json({ success: false, message: "無效的狀態" });
    }

    const triggers = daysOfWeek.map(day => ({
        platform: "time",
        at: triggerTime,
        weekday: day
    }));

    const weekdayNames = getWeekdayNames(daysOfWeek);
    // 將 daysOfWeek 轉換為 Home Assistant 的格式
    const weekdays = daysOfWeek.map(day => {
        switch (day) {
            case 0: return 'sun';
            case 1: return 'mon';
            case 2: return 'tue';
            case 3: return 'wed';
            case 4: return 'thu';
            case 5: return 'fri';
            case 6: return 'sat';
            default: return '';
        }
    });
    const automationConfig = {
        alias: `每周的${weekdayNames} ${triggerTime} ${state === 'on' ? '打開' : '關閉'}燈泡`,
        description: `${entity_id}在每周的${weekdayNames} ${triggerTime} ${state === 'on' ? '打開' : '關閉'}燈泡`,
        trigger: [
            {
                platform: 'time',
                at: triggerTime
            }
        ],
        condition: [
            {
                condition: 'time',
                weekday: weekdays
            }
        ],
        action: [
            {
                service: Service,
                target: {
                    entity_id: entity_id
                }
            }
        ],
        mode: "single"
    };

    try {
        const result = await createWeeklyAutomation(automationConfig,entity_id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "創建每周定時自動化失敗: " + error.message });
    }
});

// 新增查看目前所有自動化
router.get('/', async function(req, res) {
    try {
        const response = await fetchWithAuth(`${HA_URL}/api/states`, {
            method: 'GET'
        });

        const automations = response.filter(state => state.entity_id.startsWith('automation.'));
        res.json({ success: true, data: automations });
        console.log(automations);
    } catch (error) {
        res.status(500).json({ success: false, message: "獲取自動化失敗: " + error.message });
    }
});

// 刪除自動化
router.post('/delete_automation', async function(req, res) {
    const { automation_id } = req.body;

    if (!automation_id) {
        return res.status(400).json({ success: false, message: "缺少必要的參數 automation_id" });
    }

    try {
        const response = await fetchWithAuth(`${HA_URL}/api/config/automation/config/${automation_id}`, {
            
            method:'DELETE',
        });
        res.json({ success: true, message: response });
    } catch (error) {
        console.error('刪除自動化失敗:', error);
        res.status(500).json({ success: false, message: "刪除自動化失敗: " + error.message });
    }
});
// 創建場景
router.post('/create_scene', async function(req, res) {
    const { name, entities } = req.body;

    if (!name || !entities) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }

    const sceneConfig = {
        name: name,
        entities: entities
    };

    try {
        
        const response = await createScene(sceneConfig);
        res.json({ success: true, data: response });
    } catch (error) {
        console.error('創建場景失敗:', error);
        res.status(500).json({ success: false, message: "創建場景失敗: " + error.message });
    }
});

router.get('/', async function(req, res) {
    try {
        const response = await fetchWithAuth(`${HA_URL}/api/states`, {
            method: 'GET'
        });

        const automations = response.filter(state => state.entity_id.startsWith('automation.'));
        res.json({ success: true, data: automations });
        console.log(automations);
    } catch (error) {
        res.status(500).json({ success: false, message: "獲取自動化失敗: " + error.message });
    }
});

// 刪除自動化
router.post('/delete_scene', async function(req, res) {
    const { scene_id } = req.body;

    if (!scene_id) {
        return res.status(400).json({ success: false, message: "缺少必要的參數 scene_id" });
    }

    try {
        const response = await fetchWithAuth(`${HA_URL}/api/config/scene/config/${scene_id}`, {
            
            method:'DELETE',
        });
        res.json({ success: true, message: response });
    } catch (error) {
        console.error('刪除自動化失敗:', error);
        res.status(500).json({ success: false, message: "刪除自動化失敗: " + error.message });
    }
});

//當某個裝置打開或關閉時，打開或關閉另一個裝置
router.post('/device_link', async function(req, res) {
    const { entity_name, entity_id, state, target_entity_name, target_entity_id, target_state } = req.body;
    //判斷target_entity_id是switch還是light
    if (target_entity_id.startsWith('switch.')) {
        service = target_state === 'on' ? 'switch.turn_on' : 'switch.turn_off';
    } else if (target_entity_id.startsWith('light.')) {
        service = target_state === 'on' ? 'light.turn_on' : 'light.turn_off';
    } else {
        return res.status(400).json({ success: false, message: "無效的目標裝置" });
    }
    if (!entity_id || !state || !target_entity_id || !target_state) {
        return res.status(400).json({ success: false, message: "缺少必要的參數" });
    }

    try {
        const automationConfig = {
            alias: `當${entity_name}${state === 'on' ? '打開' : '關閉'}時，${target_entity_name}${target_state === 'on' ? '打開' : '關閉'}`,
            description: `當${entity_id}${state === 'on' ? '打開' : '關閉'}時，${target_entity_id} ${target_state === 'on' ? '打開' : '關閉'}`,
            trigger: [
                {
                    platform: "state",
                    entity_id: entity_id,
                    to: state
                }
            ],
            action: [
                {
                    service: service,
                    target: {
                        entity_id: target_entity_id
                    }
                }
            ],
            mode: "single"
        };

        const result = await createOneTimeAutomation(automationConfig, target_entity_id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "創建自動化失敗: " + error.message });
    }
});

module.exports = router;