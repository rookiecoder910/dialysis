# Dialysis Patient Management & Sensor Dashboard

A modern web application for managing dialysis patient records and visualizing real-time sensor data using Firebase Realtime Database.

## Features
- Patient CRUD (Create, Read, Update, Delete) operations
- Responsive dashboard UI with SPA navigation
- Real-time sensor data display (Accelerometer, Gyroscope)
- MongoDB backend with Node.js/Express
- Firebase Realtime Database integration
- Chart.js for data visualization
- FontAwesome icons

## Technologies Used
- Node.js
- Express.js
- MongoDB (Mongoose)
- HTML, CSS, JavaScript
- Chart.js
- FontAwesome
- Firebase Realtime Database

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB (local or cloud)
- Firebase project (for sensor data)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/rookiecoder910/dialysis.git
   cd dialysis
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your `.env` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3001
   ```
4. Add your Firebase web config to `index.html` (see comments in the file).

### Running the App
```sh
npm start
```
Visit `http://localhost:3001` in your browser.

## Usage
- Manage patients via the dashboard form and table.
- View live sensor data from Firebase in the dashboard cards.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
