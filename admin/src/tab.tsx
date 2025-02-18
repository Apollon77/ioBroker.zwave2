import { AppBar, Tab, Tabs } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { IoBrokerApp } from "iobroker-react/app";
import type { Translations } from "iobroker-react/i18n";
import { TabPanel } from "./components/TabPanel";
import { Associations } from "./pages/Associations";
import { Devices } from "./pages/Devices";
import { NetworkMap } from "./pages/NetworkMap";
import { useI18n } from "iobroker-react/hooks";

import { ErrorBoundary } from "react-error-boundary";
import { ZWaveLogs } from "./pages/ZWaveLogs";
import { useDevices } from "./lib/useDevices";
import { Groups } from "./pages/Groups";
import { SmartStart } from "./pages/SmartStart";

function ErrorFallback({ error, resetErrorBoundary }) {
	return (
		<div role="alert">
			<p>Something went wrong:</p>
			<pre>{error.stack}</pre>
			<button onClick={resetErrorBoundary}>Try again</button>
		</div>
	);
}

const translations: Translations = {
	en: require("./i18n/en.json"),
	de: require("./i18n/de.json"),
	ru: require("./i18n/ru.json"),
	pt: require("./i18n/pt.json"),
	nl: require("./i18n/nl.json"),
	fr: require("./i18n/fr.json"),
	it: require("./i18n/it.json"),
	es: require("./i18n/es.json"),
	pl: require("./i18n/pl.json"),
	"zh-cn": require("./i18n/zh-cn.json"),
};

const Root: React.FC = React.memo(() => {
	const [value, setValue] = React.useState(0);
	const { translate: _ } = useI18n();

	const handleTabChange = (
		// eslint-disable-next-line @typescript-eslint/ban-types
		event: React.ChangeEvent<{}>,
		newValue: number,
	) => {
		setValue(newValue);
	};

	const [devices, updateDevices] = useDevices();

	return (
		<>
			<AppBar position="static">
				<Tabs value={value} onChange={handleTabChange}>
					<Tab label={_("Devices")} />
					<Tab label={_("SmartStart")} />
					<Tab label={_("Groups")} />
					<Tab label={_("Associations")} />
					<Tab label={_("Z-Wave Logs")} />
					<Tab label={_("Network map")} />
				</Tabs>
			</AppBar>
			<TabPanel value={value} index={0}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<Devices devices={devices} />
				</ErrorBoundary>
			</TabPanel>
			<TabPanel value={value} index={1}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<SmartStart devices={devices} />
				</ErrorBoundary>
			</TabPanel>
			<TabPanel value={value} index={2}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<Groups devices={devices} />
				</ErrorBoundary>
			</TabPanel>
			<TabPanel value={value} index={3}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<Associations
						devices={devices}
						updateDevices={updateDevices}
					/>
				</ErrorBoundary>
			</TabPanel>
			<TabPanel value={value} index={4}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<ZWaveLogs />
				</ErrorBoundary>
			</TabPanel>
			<TabPanel value={value} index={5}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<NetworkMap />
				</ErrorBoundary>
			</TabPanel>
		</>
	);
});

ReactDOM.render(
	<IoBrokerApp name={"zwave2"} translations={translations}>
		<Root />
	</IoBrokerApp>,
	document.getElementById("root"),
);
