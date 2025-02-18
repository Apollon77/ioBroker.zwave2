import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { useI18n } from "iobroker-react/hooks";
import React from "react";
import type { NetworkHealStatus } from "../../../src/lib/shared";
import type { Device } from "../lib/useAPI";
import { DeviceTableRow } from "./DeviceTableRow";

const useStyles = makeStyles((theme) => ({
	root: {
		width: "100%",
		marginTop: theme.spacing(2),
	},
	container: {
		overflowY: "auto",
	},
	empty: {
		textAlign: "center",
		fontStyle: "italic",
	},
}));

export interface DeviceTableProps {
	devices: Device[];
	healingNetwork: boolean;
	networkHealProgress: NonNullable<NetworkHealStatus["progress"]>;
	isBusy: boolean;
	setBusy: (isBusy: boolean) => void;
	replaceFailedNode: (nodeId: number) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = (props) => {
	const { translate: _ } = useI18n();

	const classes = useStyles();
	const { devices, healingNetwork, networkHealProgress } = props;

	return (
		<Paper className={classes.root} elevation={2}>
			<TableContainer className={classes.container}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell align="right">#</TableCell>
							<TableCell>{_("Name")}</TableCell>
							<TableCell>{_("Type")}</TableCell>
							<TableCell>{_("Security")}</TableCell>
							<TableCell>{_("Status")}</TableCell>
							<TableCell>{_("Statistics")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{devices.length ? (
							devices.map((device) => {
								const nodeId = device.value.native.id as number;
								return (
									<DeviceTableRow
										key={`device-${nodeId}`}
										isBusy={props.isBusy}
										setBusy={props.setBusy}
										device={device}
										healStatus={
											healingNetwork
												? networkHealProgress[nodeId]
												: undefined
										}
										replaceFailedNode={() =>
											props.replaceFailedNode(nodeId)
										}
									/>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={6}
									className={classes.empty}
								>
									{_("No devices present")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};
