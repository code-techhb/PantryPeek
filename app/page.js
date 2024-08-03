'use client';
// -------------------------------------------- Imports ------------------------------------------
import React, { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import {
  Box,
  Typography,
  Modal,
  Button,
  TextField,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  collection,
  deleteDoc,
  getDocs,
  query,
  setDoc,
  doc,
  getDoc,
} from 'firebase/firestore';

// -------------------------------------------- MUI ------------------------------------------
const boxModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 600,
  bgcolor: '#F1F8E8',
  border: '3 solid black',
  boxShadow: 24,
  padding: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  transform: 'translate(-50%, -50%)',
};

const theme = createTheme({
  typography: {
    fontFamily: 'serif',
  },
});

// -------------------------------------------- State Management var ------------------------------------------

export default function Home() {
  // First , set state variables
  const [pantry, setPantry] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredPantry, setFilteredPantry] = useState([]);
  const [hasAddedItem, setHasAddedItem] = useState(false);
  const [lowQuantityItems, setLowQuantityItems] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  // -------------------------------------------- Store Functions ------------------------------------------
  // Function to update the collection
  const updatePantry = async () => {
    // get data from the collection using a query
    const snapshot = query(collection(firestore, 'inventory'));
    // Now, let's get the docs in the snapshot (col)
    const documents = await getDocs(snapshot);
    // Initiate a list to store the docs in documents
    const pantryList = [];
    const lowQuantityList = []; // To store items with quantity 1
    // Looping through the snapshot, create a new object that contains all the info from the documents
    documents.forEach((doc) => {
      const data = {
        nameOfItem: doc.id,
        ...doc.data(),
      };
      pantryList.push(data);
      if (data.quantity === 1) {
        // Add items with quantity 1 to the list
        lowQuantityList.push(data);
      }
    });
    // Assign to setPantry the data we got above
    setPantry(pantryList);
    // update filtered pantry for search function
    setFilteredPantry(pantryList);
    // lowQuantity for message function
    setLowQuantityItems(lowQuantityList);
  };

  // Function to add items
  const addItem = async (item, quantity, category) => {
    // Normalize item name and category to trim and lowercase them
    const normalizedItem = item.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    // get hold of the document
    const actualDoc = doc(collection(firestore, 'inventory'), normalizedItem);
    // get the doc snapshot(data)
    const docSnapshot = await getDoc(actualDoc);
    // Now let's check if the item(doc) exists in the store
    if (docSnapshot.exists()) {
      // item exists, get hold of its quantity
      const { quantity: existingQuantity } = docSnapshot.data();
      // increase quantity by 1 since it already exists
      await setDoc(
        actualDoc,
        {
          quantity: Number(existingQuantity) + Number(quantity),
          category: normalizedCategory,
        },
        { merge: true }
      );
    } else {
      // create a new entry
      await setDoc(actualDoc, { category: normalizedCategory, quantity });
    }
    await updatePantry();
    // Show Pantry
    setHasAddedItem(true);
  };

  // Function to remove items from the pantry and store.
  const removeItem = async (item) => {
    // Normalize item name to trim and lowercase it
    const normalizedItem = item.trim().toLowerCase();
    // get hold of the document
    const actualDoc = doc(collection(firestore, 'inventory'), normalizedItem);
    // get the doc snapshot(data)
    const docSnapshot = await getDoc(actualDoc);
    // Now let's check if the item(doc) exists in the store
    if (docSnapshot.exists()) {
      // items exits, get hold of its quantity
      const { quantity, category } = docSnapshot.data();

      if (quantity <= 1) {
        await deleteDoc(actualDoc);
      } else {
        // reduce quantity by 1 and update the value in store if more than 1
        await setDoc(
          actualDoc,
          { quantity: quantity - 1, category: category },
          { merge: true }
        );
      }
    }
    await updatePantry();
  };

  // -------------------------------------------- Handler functions ------------------------------------------
  // Handler functions
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  // add
  const handleAddItem = () => {
    addItem(itemName, itemQuantity, itemCategory);
    setItemName('');
    setItemQuantity(0);
    setItemCategory('');
    handleClose();
  };
  // Search
  const handleSearchClick = () => {
    // toggle search mode
    setIsSearching(!isSearching);
    if (!isSearching) {
      // reset filtered pantry list when search mode is turned off
      setFilteredPantry(pantry);
    }
  };

  // Function to handle message click
  const handleMessageClick = () => {
    // Toggle message display
    setShowMessage(!showMessage);
  };

  // -------------------------------------------- Effect ------------------------------------------
  // update the pantry
  useEffect(() => {
    updatePantry();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPantry(
        pantry.filter(
          (item) =>
            item.nameOfItem
              .toLowerCase()
              .includes(searchTerm.toLowerCase().trim()) ||
            item.category
              .toLowerCase()
              .includes(searchTerm.toLowerCase().trim())
        )
      );
    } else {
      setFilteredPantry(pantry);
    }
  }, [searchTerm, pantry]);

  // ------------------------------------------ Display --------------------------------------------------

  return (
    <ThemeProvider theme={theme}>
      <Box
        display="flex"
        width="100vw"
        height="100vh"
        sx={{ backgroundColor: '#F1F8E8' }}
      >
        {/* Sidebar */}
        {hasAddedItem && (
          <Drawer
            variant="permanent"
            anchor="left"
            sx={{
              width: 200,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 200,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F1F8E8',
              },
            }}
          >
            <List>
              <ListItem button onClick={handleOpen}>
                <ListItemText primary=" ✚ Add" />
              </ListItem>
              <ListItem button onClick={handleSearchClick}>
                <ListItemText primary=" 🔎 Search" />
              </ListItem>
              <ListItem button onClick={handleMessageClick}>
                <ListItemText primary=" 🔔 Reminder" />
              </ListItem>
              {showMessage && lowQuantityItems.length > 0 && (
                // Conditionally render message
                <ListItem>
                  <ListItemText
                    primary={`You need to buy: ${lowQuantityItems
                      .map((item) => item.nameOfItem)
                      .join(', ')}`}
                  />
                </ListItem>
              )}
            </List>
          </Drawer>
        )}
        {/* Main Content */}
        <Box
          flexGrow={1}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={5}
          p={3}
        >
          {/* Search field */}
          {hasAddedItem && isSearching && (
            <>
              <TextField
                label="Search"
                variant="outlined"
                margin="normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </>
          )}

          {/* Modal add item */}
          <Modal open={open} onClose={handleClose}>
            <Box sx={boxModalStyle}>
              <Typography variant="h5">Add Item</Typography>
              <form noValidate autoComplete="off">
                <TextField
                  label="Item Name"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value.trim().toLowerCase());
                  }}
                />

                <TextField
                  label="Category"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  value={itemCategory}
                  onChange={(e) => {
                    setItemCategory(e.target.value.trim().toLowerCase());
                  }}
                />

                <TextField
                  label="Quantity"
                  variant="outlined"
                  fullWidth
                  required
                  margin="normal"
                  type="number"
                  onChange={(e) => {
                    setItemQuantity(e.target.value);
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  sx={{
                    backgroundColor: '#55AD9B',
                    color: '#0c0c0c',
                  }}
                >
                  Add to Pantry
                </Button>
              </form>
            </Box>
          </Modal>

          {/* Conditionally Render Welcome Message and Button */}
          {!hasAddedItem && (
            <Stack>
              <Typography variant="h2">Welcome to PantryPeek</Typography>
              <Button
                variant="contained"
                style={{
                  backgroundColor: '#55AD9B',
                  color: '#0c0c0c',
                  fontSize: '20px',
                }} //using style version
                onClick={() => {
                  handleOpen();
                }}
              >
                Ready to Track Items
              </Button>
            </Stack>
          )}

          {/* Display for items */}
          {hasAddedItem && (
            <Box border="2px solid #000">
              <Box
                width="800px"
                height="100px"
                bgcolor="#95D2B3"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography variant="h2" color="#0c0c0c">
                  Your PantryPeek
                </Typography>
              </Box>
              {/* Header */}
              <Box
                width="800px"
                height="50px"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="#55AD9B"
                padding={3}
              >
                <Typography variant="h6">Item</Typography>
                <Typography variant="h6">Category</Typography>
                <Typography variant="h6">Quantity</Typography>
                <Typography variant="h6">Delete</Typography>
              </Box>
              <Stack width="800px" height="500px" spacing={2} overflow="auto">
                {filteredPantry.map(({ nameOfItem, category, quantity }) => (
                  <Box
                    key={nameOfItem}
                    width="100%"
                    minHeight="120px"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    bgcolor="#D8EFD3"
                    padding={3}
                  >
                    <Typography variant="h6">{nameOfItem}</Typography>
                    <Typography variant="h6">{category}</Typography>
                    <Typography variant="h6">{quantity}</Typography>
                    <Button onClick={() => removeItem(nameOfItem)}>❌</Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
