import React, { useState } from 'react'
import { Portal, Snackbar } from 'react-native-paper'

export default function CustomSnackbar({ snackbarMsg, setSnackbarMsg } : { snackbarMsg : string, setSnackbarMsg :  React.Dispatch<React.SetStateAction<string>> }) {

	return (
		<Portal>
			<Snackbar
				visible={snackbarMsg.length > 0}
				duration={5000}
				onDismiss={() => setSnackbarMsg("")}>
				{snackbarMsg}
			</Snackbar>
		</Portal>
	)
}
