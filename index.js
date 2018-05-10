const browserLoader = () => {
	const script = document.createElement('script');
	if ('noModule' in script) {
		script.src = 'dist/module.js';
	} else {
		script.src = 'dist/nomodule.js';
	}
	document.head.appendChild(script);
};

if(typeof process === 'object') require('./dist/common');
else if (typeof window !== 'undefined') browserLoader();
else throw new Error('Unsupported Environment');
