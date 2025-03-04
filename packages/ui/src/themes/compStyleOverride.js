export default function componentStyleOverrides(theme) {
    const bgColor = theme.colors?.grey50
    return {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: theme?.customization?.isDarkMode
                        ? `${theme.colors?.grey500} ${theme.colors?.darkPrimaryMain}`
                        : `${theme.colors?.grey300} ${theme.paper}`,
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        width: 8,
                        height: 8,
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 4,
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.grey500 : theme.colors?.grey300,
                        minHeight: 24,
                        border: `2px solid ${theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper}`
                    },
                    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                        backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryMain : theme.paper
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    padding: '8px 16px',
                    '&:hover': {
                        boxShadow: theme?.customization?.isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.MuiButton-contained': {
                        '&:hover': {
                            boxShadow: theme?.customization?.isDarkMode ? '0 6px 16px rgba(0,0,0,0.4)' : '0 6px 16px rgba(0,0,0,0.1)'
                        }
                    }
                },
                containedPrimary: {
                    background: theme?.customization?.isDarkMode ? 
                        'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' : 
                        theme.colors?.primaryMain,
                    '&:hover': {
                        background: theme?.customization?.isDarkMode ? 
                            'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)' : 
                            theme.colors?.primaryDark
                    }
                }
            }
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    color: theme?.customization?.isDarkMode ? theme.colors?.paper : 'inherit',
                    background: theme?.customization?.isDarkMode ? theme.colors?.darkPrimaryLight : 'inherit'
                }
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: theme?.customization?.isDarkMode ? theme.colors?.darkPaper : theme.paper,
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 8px 24px rgba(0,0,0,0.2)' : 
                        '0 8px 24px rgba(0,0,0,0.05)'
                },
                rounded: {
                    borderRadius: '12px'
                },
                elevation1: {
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 4px 12px rgba(0,0,0,0.2)' : 
                        '0 4px 12px rgba(0,0,0,0.05)'
                },
                elevation2: {
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 6px 16px rgba(0,0,0,0.25)' : 
                        '0 6px 16px rgba(0,0,0,0.08)'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 8px 24px rgba(0,0,0,0.2)' : 
                        '0 8px 24px rgba(0,0,0,0.05)',
                    border: theme?.customization?.isDarkMode ? 
                        `1px solid ${theme.colors?.darkLevel2}` : 
                        'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme?.customization?.isDarkMode ? 
                            '0 12px 28px rgba(0,0,0,0.3)' : 
                            '0 12px 28px rgba(0,0,0,0.1)'
                    }
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors?.textDark,
                    padding: '16px 20px'
                },
                title: {
                    fontSize: '1.125rem',
                    fontWeight: 600
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '16px 20px'
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '12px 20px'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '8px',
                    margin: '2px 8px',
                    '&.Mui-selected': {
                        color: theme.menuSelected,
                        backgroundColor: theme?.customization?.isDarkMode ? 
                            'rgba(124, 77, 255, 0.15)' : 
                            theme.menuSelectedBack,
                        '&:hover': {
                            backgroundColor: theme?.customization?.isDarkMode ? 
                                'rgba(124, 77, 255, 0.25)' : 
                                theme.menuSelectedBack
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme?.customization?.isDarkMode ? 
                                theme.colors?.darkSecondaryMain : 
                                theme.menuSelected
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme?.customization?.isDarkMode ? 
                            'rgba(255, 255, 255, 0.05)' : 
                            theme.menuSelectedBack,
                        color: theme.menuSelected,
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    }
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    minWidth: '36px'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.textDark,
                    fontWeight: 500
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.textDark,
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '0.875rem'
                    },
                    '&.Mui-disabled': {
                        WebkitTextFillColor: theme?.customization?.isDarkMode ? theme.colors?.grey500 : theme.darkTextSecondary
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: theme?.customization?.isDarkMode ? 
                        theme.colors?.darkPrimary800 : 
                        bgColor,
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme?.customization?.isDarkMode ? 
                            'rgba(255, 255, 255, 0.1)' : 
                            theme.colors?.grey400
                    },
                    '&:hover $notchedOutline': {
                        borderColor: theme.colors?.primaryLight
                    },
                    '&.MuiInputBase-multiline': {
                        padding: 1
                    },
                    '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme?.customization?.isDarkMode ? 
                                theme.colors?.darkSecondaryMain : 
                                theme.colors?.primaryMain,
                            borderWidth: '1px'
                        }
                    }
                },
                input: {
                    fontWeight: 500,
                    background: theme?.customization?.isDarkMode ? 
                        theme.colors?.darkPrimary800 : 
                        bgColor,
                    padding: '12px 14px',
                    borderRadius: '8px',
                    '&.MuiInputBase-inputSizeSmall': {
                        padding: '8px 12px',
                        '&.MuiInputBase-inputAdornedStart': {
                            paddingLeft: 0
                        }
                    }
                },
                inputAdornedStart: {
                    paddingLeft: 4
                },
                notchedOutline: {
                    borderRadius: '8px'
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    '&.Mui-disabled': {
                        color: theme.colors?.grey300
                    }
                },
                mark: {
                    backgroundColor: theme.paper,
                    width: '4px'
                },
                valueLabel: {
                    color: theme?.colors?.primaryLight
                },
                track: {
                    background: theme?.customization?.isDarkMode ? 
                        'linear-gradient(90deg, #2196f3 0%, #1976d2 100%)' : 
                        theme.colors?.primaryMain
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: theme?.customization?.isDarkMode ? 
                        'rgba(255, 255, 255, 0.08)' : 
                        theme.divider,
                    opacity: 1
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    color: theme.colors?.primaryDark,
                    background: theme?.customization?.isDarkMode ? 
                        'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' : 
                        theme.colors?.primary200
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '6px',
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: 'inherit'
                    }
                },
                filled: {
                    background: theme?.customization?.isDarkMode ? 
                        'rgba(255, 255, 255, 0.1)' : 
                        theme.colors?.grey200
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme?.customization?.isDarkMode ? theme.colors?.paper : theme.paper,
                    background: theme?.customization?.isDarkMode ? 
                        theme.colors?.darkLevel2 : 
                        theme.colors?.grey700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 4px 12px rgba(0,0,0,0.3)' : 
                        '0 4px 12px rgba(0,0,0,0.1)'
                }
            }
        },
        MuiAutocomplete: {
            styleOverrides: {
                option: {
                    '&:hover': {
                        background: theme?.customization?.isDarkMode ? 
                            'rgba(255, 255, 255, 0.05) !important' : 
                            ''
                    }
                },
                paper: {
                    boxShadow: theme?.customization?.isDarkMode ? 
                        '0 8px 24px rgba(0,0,0,0.3)' : 
                        '0 8px 24px rgba(0,0,0,0.1)'
                }
            }
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: 'none',
                    border: theme?.customization?.isDarkMode ? 
                        `1px solid rgba(255, 255, 255, 0.08)` : 
                        `1px solid ${theme.colors?.grey200}`
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: theme?.customization?.isDarkMode ? 
                        `1px solid rgba(255, 255, 255, 0.08)` : 
                        `1px solid ${theme.colors?.grey200}`,
                    padding: '12px 16px'
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: theme?.customization?.isDarkMode ? 
                        theme.colors?.darkLevel1 : 
                        theme.colors?.grey100
                }
            }
        }
    }
}
