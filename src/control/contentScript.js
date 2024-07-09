'use strict';

{
  const { getURL } = browser.runtime;
  const isAppLoaded = () => !!document.getElementById('app');
  const readyState = () => !Array.from(document.querySelector('#app>.flex-col>.flex-col').childNodes).filter(node => node.nodeType === 8).length;
  const waitForLoad = () => new Promise(resolve => {
    window.requestAnimationFrame(() => (isAppLoaded() && readyState()) ? resolve() : waitForLoad().then(resolve));
  });
  const runContextScript = () => {
    const script = document.createElement('script');
    script.src = getURL('control/pageContext.js');
    (document.head || document.documentElement).append(script);
    script.onload = () => script.remove();
  };

  runContextScript();

  waitForLoad().then(() => {

    import(getURL('/scripts/utils/jsTools.js')).then(({ deepEquals, importFeatures }) => {
      let installedFeatures = {};
      let enabledFeatures = [];
      const preferenceListeners = {};

      const executeFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if ('css' in feature) {
            const link = Object.assign(document.createElement('link'), {
              rel: 'stylesheet',
              href: getURL(`/scripts/${name}.css`)
            });
      
            document.documentElement.appendChild(link);
          }
          if ('js' in feature) {
            const scriptPath = getURL(`/scripts/${name}.js`);
            const { main, clean, update } = await import(scriptPath);
      
            window.requestAnimationFrame(() => main().catch(console.error));
      
            preferenceListeners[name] = (changes, areaName) => {
              const { preferences } = changes;
              if (areaName !== 'local' || typeof preferences === 'undefined') return;
        
              const changed = Object.keys(preferences.newValue).filter(key => !deepEquals(preferences?.newValue[key], preferences?.oldValue[key]));
              if ((changed.includes(name) && preferences?.newValue[name].enabled === true) 
                || feature.recieveUpdates?.some(key => changed.includes(key))) {
                if (update instanceof Function) update(preferences.newValue[name]);
                else clean().then(main);
              }
            };

            browser.storage.onChanged.addListener(preferenceListeners[name]);
          }
        } catch (e) { console.error(`failed to execute feature ${name}`, e); }
      };
      const destroyFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if (feature.css) document.querySelector(`link[href='${getURL(`/scripts/${name}.css`)}']`).remove();
          if (feature.js) {
            const scriptPath = getURL(`/scripts/${name}.js`);
            const { clean } = await import(scriptPath);

            window.requestAnimationFrame(() => clean().catch(console.error));

            if (browser.storage.onChanged.hasListener(preferenceListeners[name])) browser.storage.onChanged.removeListener(preferenceListeners[name]);
            delete preferenceListeners[name];
          }

          enabledFeatures = enabledFeatures.filter(val => val !== name);
        } catch (e) { console.error(`failed to destroy feature ${name}`, e); }
      };

      const onStorageChanged = async (changes, areaName) => {
        const { preferences } = changes;
        if (areaName !== 'local' || typeof preferences === 'undefined') return;
  
        const { oldValue = {}, newValue = {} } = preferences;

        console.log(preferences);
  
        const newlyEnabled = Object.keys(newValue).filter(feature => !oldValue[feature]?.enabled && newValue[feature]?.enabled);
        const newlyDisabled = Object.keys(oldValue).filter(feature => oldValue[feature]?.enabled && !newValue[feature]?.enabled);
  
        newlyEnabled.forEach(executeFeature);
        enabledFeatures.push(newlyEnabled);
        newlyDisabled.forEach(destroyFeature);
      };

      const transformPreferences = preferences => {
        const returnObj = { enabled: preferences.enabled };
        if ('options' in preferences) {
          returnObj.options = {};
          Object.keys(preferences.options).map(option => {
            returnObj.options[option] = preferences.options[option].value;
          });
        }
        return returnObj;
      };

      const initFeatures = async () => {
        installedFeatures = await importFeatures();
  
        let { preferences } = await browser.storage.local.get('preferences');
  
        if (typeof preferences !== 'undefined') {
          Object.keys(installedFeatures).forEach(feature => { // push new features and options to existing preferences
            if (typeof preferences[feature] === 'undefined') {
              preferences[feature] = transformPreferences(installedFeatures[feature].preferences);
              preferences[feature].new = true;
            }
            if ('options' in installedFeatures[feature].preferences) {
              if (typeof preferences[feature].options === 'undefined') {
                preferences[feature].options = {};
                preferences[feature].new = true;
              }
              Object.keys(installedFeatures[feature].preferences.options).forEach(option => {
                if (typeof preferences[feature].options[option] === 'undefined') {
                  if ('inherit' in installedFeatures[feature].preferences.options[option]) {
                    const [inheritFeature, inheritOption] = installedFeatures[feature].preferences.options[option].inherit.inheritFrom.split('.');
                    if (typeof preferences[inheritFeature].options[inheritOption] !== 'undefined') {
                      switch (typeof preferences[inheritFeature].options[inheritOption]) {
                        case 'boolean':
                        case 'string':
                          preferences[feature].options[option] = installedFeatures[feature].preferences.options[option].inherit[String(preferences[inheritFeature].options[inheritOption])];
                          break;
                        case 'number':
                          preferences[feature].options[option] = preferences[inheritFeature].options[inheritOption];
                          break;
                      }
                    }
                  } else preferences[feature].options[option] = installedFeatures[feature].preferences.options[option].value;
                  preferences[feature].new = true;
                }
              });
            }
          })
          Object.keys(preferences).forEach(feature => { // delete removed features and options from existing preferences
            if (!(feature in installedFeatures)) return delete preferences[feature];
            if ('options' in preferences[feature]) {
              if (!('options' in installedFeatures[feature].preferences)) return delete preferences[feature].options;
              Object.keys(preferences[feature].options).forEach(option => {
                if (!(option in installedFeatures[feature].preferences.options)) delete preferences[feature].options[option];
              });
            }
          });
        } else preferences = Object.fromEntries(Object.entries(installedFeatures).map(([name, feature]) => [name, transformPreferences(feature.preferences)]));
  
        enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);
  
        browser.storage.local.set({ preferences });
        if (enabledFeatures.length) enabledFeatures.forEach(executeFeature);
        browser.storage.onChanged.addListener(onStorageChanged);
      };
  
      initFeatures();
    });
  });
}