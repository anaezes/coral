import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export default function MenuView() {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Button color="primary" variant="contained" size="small" aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                    View Options
            </Button>
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClose}>AIS</MenuItem>
                <MenuItem onClick={handleClose}>Waves</MenuItem>
                <MenuItem onClick={handleClose}>Combined</MenuItem>
            </Menu>
        </div>
    );
}