// Get the container element  
const container = document.getElementById('container');  
/////////////// insert table counter
let tableCounter = 1;

// Function to create a new table  
function createTable() {  
  const table = document.createElement('div');  
  table.className = 'table';  
  table.style.top = `${Math.random() * 500}px`;  
  table.style.left = `${Math.random() * 700}px`;  
  table.style.backgroundColor = 'green'; // Default color
  container.appendChild(table);  
  makeDraggable(table);  
  makeDoubleClick(table);  
  /////////////////////////// table#
  table.textContent = `Table ${tableCounter++}`;
  table.style.textAlign = 'center';
  table.style.color = "Black";
  table.style.fontStyle = "bold";

}  

// Function to create a new seat  
function createSeat() {  
  const seat = document.createElement('div');  
  seat.className = 'seat';  
  seat.style.top = `${Math.random() * 500}px`;  
  seat.style.left = `${Math.random() * 700}px`;  
  seat.style.backgroundColor = 'green'; // Default color
  container.appendChild(seat);  
  makeDraggable(seat);  
  makeDoubleClick(seat);  
}  

// Function to make an element draggable  
function makeDraggable(element) {  
  let isDown = false;  
  let offset = [0, 0];  
  let dragged = false;  // Track if the element has been dragged

  element.addEventListener('mousedown', (e) => {  
    isDown = true;  
    offset = [element.offsetLeft - e.clientX, element.offsetTop - e.clientY];  
  });  

  document.addEventListener('mouseup', () => {  
    if (isDown) {
      // If not dragged, change color to yellow
      if (!dragged) {
        element.style.backgroundColor = 'yellow';
      }
    }
    isDown = false;  
    dragged = false; // Reset dragged state
  });  

  document.addEventListener('mousemove', (e) => {  
    if (isDown) {  
      element.style.top = `${e.clientY + offset[1]}px`;  
      element.style.left = `${e.clientX + offset[0]}px`;  
      dragged = true;  // Mark as dragged
      
      // Change color to green while dragging, unless it's red or yellow
      if (element.style.backgroundColor !== 'red' && element.style.backgroundColor !== 'yellow') {
        element.style.backgroundColor = 'green';  
      }
    }  
  });  

  element.addEventListener('mouseleave', () => {  
    element.classList.remove('dragging');  
  });  

  // Allow changing color to green when clicked
  element.addEventListener('click', () => {
    if (element.style.backgroundColor == 'red' || element.style.backgroundColor == 'yellow') {
      element.classList.toggle('selected'); // Toggle selection
      element.style.border = element.classList.contains('selected') ? '2px solid black' : ''; // Visual indication
    }
  });
}  

// Function to make an element change color on double click  
function makeDoubleClick(element) {  
  element.addEventListener('dblclick', () => {  
    element.style.backgroundColor = 'red';  
  });  
} 

// Add event listeners to buttons  
document.getElementById('add-table').addEventListener('click', createTable);  
document.getElementById('add-seat').addEventListener('click', createSeat);

// Reset color button functionality
document.getElementById('reset-color').addEventListener('click', () => {
  const selectedElements = document.querySelectorAll('.selected');
  selectedElements.forEach(element => {
    element.style.backgroundColor = 'green'; // Reset selected elements to green
    element.classList.remove('selected'); // Remove selection
    element.style.border = ''; // Remove visual indication
  });
});

document.getElementById('clear-all').addEventListener('click', () => {
  container.innerHTML = ''; // Removes all child elements from container
});