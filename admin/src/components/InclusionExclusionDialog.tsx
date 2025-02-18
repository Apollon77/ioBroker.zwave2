/* eslint-disable @typescript-eslint/no-empty-function */
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { useGlobals, useI18n, useIoBrokerObject } from "iobroker-react/hooks";
import React from "react";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import WarningIcon from "@material-ui/icons/Warning";
import { green, yellow } from "@material-ui/core/colors";
import clsx from "clsx";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import type { InclusionGrant } from "zwave-js/Controller";
import Alert from "@material-ui/lab/Alert";
import { QRScanner } from "./QRScanner";

const useStyles = makeStyles((theme) => ({
	strategyRoot: {
		// maxWidth: "600px",
	},
	strategyGridHeadline: {
		marginTop: theme.spacing(4),
	},
	strategyGrid: {
		marginTop: theme.spacing(1),
		display: "grid",
		gridTemplateColumns: "auto 400px",
		gridGap: theme.spacing(2),
		alignItems: "center",
	},
	strategyList: {
		...theme.typography.body2,
	},
	scanQRCodeRoot: {
		display: "flex",
		flexFlow: "column nowrap",
		gap: theme.spacing(1),
		maxWidth: "600px",
	},
	waitMessageRoot: {
		display: "grid",
		gridTemplateColumns: "minmax(auto, 10ch) 1fr",
		gridGap: theme.spacing(4),
		alignItems: "center",
		// width: "600px",
		overflow: "hidden",
	},
	grantRoot: {
		display: "flex",
		flexFlow: "column nowrap",
		gap: theme.spacing(1),
		maxWidth: "600px",
	},
	grantHeadline: {
		marginTop: theme.spacing(-1),
		marginBottom: theme.spacing(1),
	},
	grantCSA: {
		marginTop: theme.spacing(2),
	},
	validateDSKRoot: {
		maxWidth: "600px",
	},
	validateDSKGrid: {
		marginTop: theme.spacing(1),
		display: "grid",
		width: "100%",
		gridTemplateColumns: "minmax(auto, 10ch) 1fr",
		gridGap: theme.spacing(1),
		alignItems: "center",
		textAlign: "center",
	},
	resultRoot: {
		display: "grid",
		gridTemplateColumns: "auto 1fr",
		gridTemplateRows: "auto auto auto",
		alignItems: "center",
	},
	resultIcon: {
		marginRight: theme.spacing(4),
		fontSize: "64px",
		gridRow: "1 / span 3",
		gridColumn: 1,
	},
	resultIconOK: {
		color: green[500],
	},
	resultIconLowSecurity: {
		color: yellow[700],
	},
}));

export enum InclusionExclusionStep {
	SelectInclusionStrategy,
	SelectReplacementStrategy,
	QRCode,
	IncludeDevice,
	ExcludeDevice,
	GrantSecurityClasses,
	ValidateDSK,
	Busy,
	Result,
	ExclusionResult,
	ResultMessage,
}

// Copied from zwave-js
export enum InclusionStrategy {
	Default = 0,
	Insecure = 2,
	// Only for replacing nodes:
	Security_S0,
	Security_S2,

	// This is not included in zwave-js
	QRCode = -1,
}

// =============================================================================

interface SelectInclusionStrategyStepProps {
	selectStrategy: (
		strategy: InclusionStrategy,
		forceSecurity?: boolean,
	) => void;
	onCancel: () => void;
}

const SelectInclusionStrategyStep: React.FC<SelectInclusionStrategyStepProps> =
	(props) => {
		const { translate: _ } = useI18n();
		const classes = useStyles();

		const [forceSecurity, setForceSecurity] = React.useState(false);

		const strategyCaptionDefault = forceSecurity
			? _(
					"Security S2 when supported, Security S0 as a fallback, no encryption otherwise.",
			  )
			: _(
					"Security S2 when supported, Security S0 only when necessary, no encryption otherwise.",
			  );

		// Display a warning when security keys are missing
		const { namespace } = useGlobals();
		const [instanceObj] = useIoBrokerObject(`system.adapter.${namespace}`, {
			subscribe: false,
		});
		const settings = instanceObj?.native as
			| ioBroker.AdapterConfig
			| undefined;

		const keysMissing =
			settings &&
			(!settings.networkKey_S0 ||
				!settings.networkKey_S2_AccessControl ||
				!settings.networkKey_S2_Authenticated ||
				!settings.networkKey_S2_Unauthenticated);

		return (
			<>
				<DialogContent className={classes.strategyRoot}>
					<Typography variant="body2">
						{_(
							"Z-Wave supports the following security mechanisms:",
						)}
					</Typography>
					<ul
						className={classes.strategyList}
						style={{ marginTop: "0.5em" }}
					>
						<li>
							<b>Security S2</b> &ndash; {_("fast and secure")}{" "}
							<b>{_("(recommended)")}</b>
						</li>
						<li>
							<b>Security S0</b> &ndash;{" "}
							{_("secure, but slow due to a lot of overhead")}{" "}
							<b>{_("(use only when necessary)")}</b>
						</li>
						<li>{_("No encryption")}</li>
					</ul>

					{keysMissing && (
						<Alert severity="warning">
							{_(
								"At least one network key is not yet configured. This can cause problems during secure inclusion.",
							)}
						</Alert>
					)}

					<Typography
						variant="body1"
						className={classes.strategyGridHeadline}
					>
						{_("Please choose an inclusion strategy")}:
					</Typography>
					<div className={classes.strategyGrid}>
						<div
							style={{
								gridRow: 1,
								display: "flex",
								flexFlow: "column",
							}}
						>
							<Button
								variant="contained"
								color="primary"
								onClick={() =>
									props.selectStrategy(
										InclusionStrategy.Default,
										forceSecurity,
									)
								}
							>
								{_("Default (secure)")}
							</Button>
							<FormControlLabel
								label={_("Prefer S0 over no encryption")}
								control={
									<Checkbox
										checked={forceSecurity}
										onChange={(event, checked) =>
											setForceSecurity(checked)
										}
									/>
								}
							/>
						</div>
						<Typography
							variant="caption"
							style={{ alignSelf: "flex-start" }}
						>
							{strategyCaptionDefault}
							<br />
							{_(
								"Requires user interaction during the inclusion.",
							)}
						</Typography>

						<Button
							variant="contained"
							color="secondary"
							style={{ gridRow: 2 }}
							onClick={() =>
								props.selectStrategy(InclusionStrategy.QRCode)
							}
						>
							{_("Scan QR Code")}
						</Button>

						<Button
							variant="contained"
							color="secondary"
							style={{ gridRow: 3 }}
							onClick={() =>
								props.selectStrategy(
									InclusionStrategy.Security_S0,
								)
							}
						>
							{_("Security S0")}
						</Button>
						<Typography style={{ gridRow: 3 }} variant="caption">
							{_(
								"Only use S0, even if S2 is available. Allows including devices that require security but don't behave correctly during S2 inclusion.",
							)}
						</Typography>

						<Button
							variant="contained"
							color="default"
							style={{ gridRow: 4 }}
							onClick={() =>
								props.selectStrategy(InclusionStrategy.Insecure)
							}
						>
							{_("No encryption")}
						</Button>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						variant="contained"
						onClick={props.onCancel}
						color="primary"
					>
						{_("Cancel")}
					</Button>
				</DialogActions>
			</>
		);
	};

// =============================================================================

interface SelectReplacementStrategyStepProps {
	selectStrategy: (
		strategy:
			| InclusionStrategy.Insecure
			| InclusionStrategy.Security_S0
			| InclusionStrategy.Security_S2,
	) => void;
	onCancel: () => void;
}

const SelectReplacementStrategyStep: React.FC<SelectReplacementStrategyStepProps> =
	(props) => {
		const { translate: _ } = useI18n();
		const classes = useStyles();

		return (
			<>
				<DialogContent className={classes.strategyRoot}>
					<Typography
						variant="body1"
						className={classes.strategyGridHeadline}
					>
						{_("Please choose a replacement strategy")}:
					</Typography>
					<div className={classes.strategyGrid}>
						<Button
							variant="contained"
							color="primary"
							style={{ gridRow: 1 }}
							onClick={() =>
								props.selectStrategy(
									InclusionStrategy.Security_S2,
								)
							}
						>
							{_("Security S2")}
						</Button>
						<Typography
							variant="caption"
							style={{ alignSelf: "flex-start" }}
						>
							{_("fast and secure")}
							<br />
							{_("(recommended)")}
						</Typography>

						<Button
							variant="contained"
							color="secondary"
							style={{ gridRow: 2 }}
							disabled
							onClick={() =>
								props.selectStrategy(
									InclusionStrategy.Security_S0,
								)
							}
						>
							{_("Security S0")}
						</Button>
						<Typography variant="caption">
							{_("secure, but slow due to a lot of overhead")}
							<br />
							{_("(use only when necessary)")}
						</Typography>

						<Button
							variant="contained"
							color="default"
							style={{ gridRow: 3 }}
							onClick={() =>
								props.selectStrategy(InclusionStrategy.Insecure)
							}
						>
							{_("No encryption")}
						</Button>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						variant="contained"
						onClick={props.onCancel}
						color="primary"
					>
						{_("Cancel")}
					</Button>
				</DialogActions>
			</>
		);
	};

// =============================================================================

export interface ScanQRCodeStepProps {
	onScan: (code: string) => void;
	onCancel?: () => void;
}

const ScanQRCodeStep: React.FC<ScanQRCodeStepProps> = (props) => {
	const classes = useStyles();
	const { translate: _ } = useI18n();

	const [busy, setBusy] = React.useState(false);
	const handleScan = React.useCallback(
		(code: string) => {
			if (busy) return;
			setBusy(true);
			// Add a short delay so the scanner markers can be seen
			setTimeout(() => {
				props.onScan(code);
			}, 500);
		},
		[busy, setBusy, props.onScan],
	);

	return (
		<>
			<DialogContent className={classes.scanQRCodeRoot}>
				<QRScanner onDetect={handleScan} />
			</DialogContent>
			<DialogActions>
				{props.onCancel && (
					<Button
						variant="contained"
						onClick={props.onCancel}
						color="primary"
					>
						{_("Cancel")}
					</Button>
				)}
			</DialogActions>
		</>
	);
};

// =============================================================================

export interface WaitMessageProps {
	message: string;
	onCancel?: () => void;
}

const WaitMessageStep: React.FC<WaitMessageProps> = (props) => {
	const classes = useStyles();
	const { translate: _ } = useI18n();

	return (
		<>
			<DialogContent className={classes.waitMessageRoot}>
				<CircularProgress size={48} />
				<Typography variant="body1">{props.message}</Typography>
			</DialogContent>
			<DialogActions>
				{props.onCancel && (
					<Button
						variant="contained"
						onClick={props.onCancel}
						color="primary"
					>
						{_("Cancel")}
					</Button>
				)}
			</DialogActions>
		</>
	);
};

// =============================================================================

interface GrantSecurityClassesStepProps {
	request: InclusionGrant;
	grantSecurityClasses: (grant: InclusionGrant) => void;
	onCancel: () => void;
}

const GrantSecurityClassesStep: React.FC<GrantSecurityClassesStepProps> = (
	props,
) => {
	const { translate: _ } = useI18n();
	const classes = useStyles();

	const request = props.request;
	const requestS2AccessControl = request.securityClasses.includes(2);
	const requestS2Authenticated = request.securityClasses.includes(1);
	const requestS2Unauthenticated = request.securityClasses.includes(0);
	const requestS0Legacy = request.securityClasses.includes(7);
	const requestCSA = request.clientSideAuth;

	const [grantS2AccessControl, setGrantS2AccessControl] = React.useState(
		requestS2AccessControl,
	);
	const [grantS2Authenticated, setGrantS2Authenticated] = React.useState(
		requestS2Authenticated,
	);
	const [grantS2Unauthenticated, setGrantS2Unauthenticated] = React.useState(
		requestS2Unauthenticated,
	);
	const [grantS0Legacy, setGrantS0Legacy] = React.useState(requestS0Legacy);
	const [grantCSA, setGrantCSA] = React.useState(requestCSA);

	// This will be called when the user clicks confirm
	const handleOk = () => {
		const securityClasses: InclusionGrant["securityClasses"] = [];
		if (grantS2AccessControl) securityClasses.push(2);
		if (grantS2Authenticated) securityClasses.push(1);
		if (grantS2Unauthenticated) securityClasses.push(0);
		if (grantS0Legacy) securityClasses.push(7);

		const grant: InclusionGrant = {
			securityClasses,
			clientSideAuth: grantCSA,
		};
		props.grantSecurityClasses(grant);
	};

	return (
		<>
			<DialogContent className={classes.grantRoot}>
				<Typography variant="body1">
					{_(
						"Please choose which of the following security classes to grant to the new node.",
					)}
				</Typography>
				<Typography variant="caption" className={classes.grantHeadline}>
					{_(
						"At least one must be granted or the key exchange will be canceled.",
					)}
				</Typography>

				<FormControlLabel
					label={
						<>
							<b>
								S2 Access Control
								{!requestS2AccessControl && (
									<> ({_("not requested")})</>
								)}
							</b>
							<br />
							<Typography variant="caption">
								{_("Example:")} {_("Door locks, garage doors")},
								...
							</Typography>
						</>
					}
					disabled={!requestS2AccessControl}
					control={
						<Checkbox
							checked={grantS2AccessControl}
							onChange={(event, checked) =>
								setGrantS2AccessControl(checked)
							}
						/>
					}
				/>
				<FormControlLabel
					label={
						<>
							<b>
								S2 Authenticated
								{!requestS2Authenticated && (
									<> ({_("not requested")})</>
								)}
							</b>
							<br />
							<Typography variant="caption">
								{_("Example:")}{" "}
								{_("Lighting, sensors, security systems")}, ...
							</Typography>
						</>
					}
					disabled={!requestS2Authenticated}
					control={
						<Checkbox
							checked={grantS2Authenticated}
							onChange={(event, checked) =>
								setGrantS2Authenticated(checked)
							}
						/>
					}
				/>
				<FormControlLabel
					label={
						<>
							<b>
								S2 Unauthenticated
								{!requestS2Unauthenticated && (
									<> ({_("not requested")})</>
								)}
							</b>
							<br />
							<Typography variant="caption">
								{_(
									"Like S2 Authenticated, but without verification that the correct device is included",
								)}
							</Typography>
						</>
					}
					disabled={!requestS2Unauthenticated}
					control={
						<Checkbox
							checked={grantS2Unauthenticated}
							onChange={(event, checked) =>
								setGrantS2Unauthenticated(checked)
							}
						/>
					}
				/>
				<FormControlLabel
					label={
						<>
							<b>
								S0 Legacy
								{!requestS0Legacy && (
									<> ({_("not requested")})</>
								)}
							</b>
							<br />
							<Typography variant="caption">
								{_("Example:")}{" "}
								{_("Legacy door locks without S2 support")}
							</Typography>
						</>
					}
					disabled={!requestS0Legacy}
					control={
						<Checkbox
							checked={grantS0Legacy}
							onChange={(event, checked) =>
								setGrantS0Legacy(checked)
							}
						/>
					}
				/>
				<FormControlLabel
					className={classes.grantCSA}
					label={
						<>
							<b>
								Client Side Authentication
								{!requestCSA && <> ({_("not requested")})</>}
							</b>
							<br />
							<Typography variant="caption">
								{_(
									"For devices without a DSK. Authentication of the inclusion happens on the device instead of in ioBroker.",
								)}
							</Typography>
						</>
					}
					disabled={!requestCSA}
					control={
						<Checkbox
							checked={grantCSA}
							onChange={(event, checked) => setGrantCSA(checked)}
						/>
					}
				/>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" onClick={handleOk} color="primary">
					{_("OK")}
				</Button>
				<Button
					variant="contained"
					onClick={props.onCancel}
					color="primary"
				>
					{_("Cancel")}
				</Button>
			</DialogActions>
		</>
	);
};

// =============================================================================

interface ValidateDSKStepProps {
	setPIN: (pin: string) => void;
	onCancel: () => void;
	dsk: string;
}

const ValidateDSKStep: React.FC<ValidateDSKStepProps> = (props) => {
	const { translate: _ } = useI18n();

	const [pin, setPIN] = React.useState("");
	const [error, setError] = React.useState(false);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const pin = event.target.value.replace(/[^0-9]/g, "");
		setPIN(pin);
		setError(false);
	};

	const handleBlur = () => {
		if (pin.length !== 5) setError(true);
	};

	const handleOk = () => {
		if (pin.length === 5) props.setPIN(pin);
	};

	const classes = useStyles();
	return (
		<>
			<DialogContent className={classes.validateDSKRoot}>
				<Typography
					variant="body1"
					className={classes.strategyGridHeadline}
				>
					{_(
						"Please enter the 5-digit PIN for your device and verify that the rest of the device-specific key (DSK) matches the one on your device or the manual.",
					)}
				</Typography>
				<div className={classes.validateDSKGrid}>
					<TextField
						autoFocus={true}
						variant="outlined"
						margin="dense"
						inputProps={{
							maxLength: 5,
							style: { textAlign: "center" },
						}}
						value={pin}
						error={!!error}
						onChange={handleChange}
						onBlur={handleBlur}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleOk();
							if (e.key === "Escape") props.onCancel();
						}}
					></TextField>
					<Typography variant="body1">{props.dsk}</Typography>
					<Typography variant="caption">PIN</Typography>
					<Typography variant="caption">DSK</Typography>
				</div>
			</DialogContent>
			<DialogActions>
				<Button
					disabled={pin.length !== 5}
					onClick={handleOk}
					color="primary"
				>
					{_("OK")}
				</Button>
				<Button
					variant="contained"
					onClick={props.onCancel}
					color="primary"
				>
					{_("Cancel")}
				</Button>
			</DialogActions>
		</>
	);
};

// =============================================================================

export interface ResultStepProps {
	nodeId: number;
	lowSecurity: boolean;
	securityClass?: string;
	onDone: () => void;
}

const ResultStep: React.FC<ResultStepProps> = (props) => {
	const { translate: _ } = useI18n();
	const classes = useStyles();

	const Icon = props.lowSecurity ? WarningIcon : CheckCircleIcon;
	const caption = props.lowSecurity
		? _("Node %s was added insecurely!", props.nodeId.toString())
		: _("Node %s was added successfully!", props.nodeId.toString());
	const message1 = props.lowSecurity
		? _(
				"There was an error during secure inclusion. To try again, exclude the node first.",
		  )
		: _("Security class: %s", props.securityClass ?? _("None"));

	const message2 = _(
		"The device is now being interviewed. It might take a while to show up.",
	);

	return (
		<>
			<DialogContent className={classes.resultRoot}>
				<Icon
					className={clsx(
						classes.resultIcon,
						props.lowSecurity
							? classes.resultIconLowSecurity
							: classes.resultIconOK,
					)}
				/>
				<Typography
					variant="body1"
					style={{ fontWeight: "bold", fontSize: "125%" }}
				>
					{caption}
				</Typography>
				<Typography variant="body2">{message1}</Typography>
				<Typography variant="body2">{message2}</Typography>
			</DialogContent>
			<DialogActions>
				<Button
					variant="contained"
					onClick={props.onDone}
					color="primary"
				>
					{_("OK")}
				</Button>
			</DialogActions>
		</>
	);
};

// =============================================================================

export interface ExclusionResultStepProps {
	nodeId: number;
	onDone: () => void;
}

const ExclusionResultStep: React.FC<ExclusionResultStepProps> = (props) => {
	const { translate: _ } = useI18n();
	const classes = useStyles();

	return (
		<>
			<DialogContent className={classes.resultRoot}>
				<CheckCircleIcon
					className={clsx(classes.resultIcon, classes.resultIconOK)}
				/>
				<Typography variant="body2">
					{_(
						"Node %s was removed from the network!",
						props.nodeId.toString(),
					)}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button
					variant="contained"
					onClick={props.onDone}
					color="primary"
				>
					{_("OK")}
				</Button>
			</DialogActions>
		</>
	);
};

// =============================================================================

export interface ResultMessageStepProps {
	success: boolean;
	title: string;
	message: React.ReactNode;
	onDone: () => void;
}

const ResultMessageStep: React.FC<ResultMessageStepProps> = (props) => {
	const { translate: _ } = useI18n();
	const classes = useStyles();

	const Icon = props.success ? CheckCircleIcon : WarningIcon;

	return (
		<>
			<DialogContent className={classes.resultRoot}>
				<Icon
					className={clsx(
						classes.resultIcon,
						props.success
							? classes.resultIconOK
							: classes.resultIconLowSecurity,
					)}
				/>
				<Typography
					variant="body1"
					style={{ fontWeight: "bold", fontSize: "125%" }}
				>
					{props.title}
				</Typography>
				<Typography variant="body2">{props.message}</Typography>
			</DialogContent>
			<DialogActions>
				<Button
					variant="contained"
					onClick={props.onDone}
					color="primary"
				>
					{_("OK")}
				</Button>
			</DialogActions>
		</>
	);
};

// =============================================================================

export type InclusionExclusionDialogProps = {
	onCancel: () => void;
} & (
	| ({
			step: InclusionExclusionStep.SelectInclusionStrategy;
	  } & SelectInclusionStrategyStepProps)
	| ({
			step: InclusionExclusionStep.SelectReplacementStrategy;
	  } & SelectReplacementStrategyStepProps)
	| ({ step: InclusionExclusionStep.QRCode } & ScanQRCodeStepProps)
	| { step: InclusionExclusionStep.IncludeDevice }
	| { step: InclusionExclusionStep.ExcludeDevice }
	| ({
			step: InclusionExclusionStep.GrantSecurityClasses;
	  } & GrantSecurityClassesStepProps)
	| ({ step: InclusionExclusionStep.ValidateDSK } & ValidateDSKStepProps)
	| { step: InclusionExclusionStep.Busy }
	| ({ step: InclusionExclusionStep.Result } & ResultStepProps)
	| ({ step: InclusionExclusionStep.ResultMessage } & ResultMessageStepProps)
	| ({
			step: InclusionExclusionStep.ExclusionResult;
	  } & ExclusionResultStepProps)
);

export const InclusionDialog: React.FC<
	InclusionExclusionDialogProps & { isOpen: boolean }
> = (props) => {
	const { translate: _ } = useI18n();

	const Content = React.useMemo(() => {
		switch (props.step) {
			case InclusionExclusionStep.SelectInclusionStrategy:
				return (
					<SelectInclusionStrategyStep
						selectStrategy={props.selectStrategy}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.SelectReplacementStrategy:
				return (
					<SelectReplacementStrategyStep
						selectStrategy={props.selectStrategy}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.QRCode:
				return (
					<ScanQRCodeStep
						onScan={props.onScan}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.IncludeDevice:
				return (
					<WaitMessageStep
						message={_("Put your device into inclusion mode")}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.ExcludeDevice:
				return (
					<WaitMessageStep
						message={_("Put your device into exclusion mode")}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.GrantSecurityClasses:
				return (
					<GrantSecurityClassesStep
						grantSecurityClasses={props.grantSecurityClasses}
						request={props.request}
						onCancel={props.onCancel}
					/>
				);
			case InclusionExclusionStep.ValidateDSK:
				return (
					<ValidateDSKStep
						dsk={props.dsk}
						onCancel={props.onCancel}
						setPIN={props.setPIN}
					/>
				);
			case InclusionExclusionStep.Result:
				return (
					<ResultStep
						nodeId={props.nodeId}
						lowSecurity={props.lowSecurity}
						securityClass={props.securityClass}
						onDone={props.onDone}
					/>
				);
			case InclusionExclusionStep.ExclusionResult:
				return (
					<ExclusionResultStep
						nodeId={props.nodeId}
						onDone={props.onDone}
					/>
				);
			case InclusionExclusionStep.ResultMessage:
				return (
					<ResultMessageStep
						title={props.title}
						message={props.message}
						success={props.success}
						onDone={props.onDone}
					/>
				);
			case InclusionExclusionStep.Busy:
				return (
					<WaitMessageStep
						message={_(
							"Communicating with the device, please be patient...",
						)}
					/>
				);
		}
	}, [props.step]);

	const title = React.useMemo(() => {
		switch (props.step) {
			case InclusionExclusionStep.SelectInclusionStrategy:
			case InclusionExclusionStep.IncludeDevice:
			case InclusionExclusionStep.GrantSecurityClasses:
			case InclusionExclusionStep.ValidateDSK:
			case InclusionExclusionStep.Result:
			case InclusionExclusionStep.Busy:
			case InclusionExclusionStep.QRCode:
				return _("Include device");

			case InclusionExclusionStep.SelectReplacementStrategy:
				return _("Replace device");

			case InclusionExclusionStep.ExcludeDevice:
			case InclusionExclusionStep.ExclusionResult:
				return _("Exclude device");
		}
	}, [props.step]);
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onCancel}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
			maxWidth={false}
		>
			<DialogTitle id="alert-dialog-title">{title}</DialogTitle>
			{Content}
		</Dialog>
	);
};
