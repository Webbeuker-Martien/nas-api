# NAS API

NAS API is a NodeJS RestAPI to manage your files using endpoints.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to configure the nas-api.

Production:
```bash
npm i
npm start
```

Development:
```bash
npm i
npm run dev
```

Create a .env file with the following properties:
- BASE_PATH_FROM_PROJECT (e.g. `../../../media/folder/`)
- BASE_PATH (e.g. `/media/folder/`)
- BASE_URL (e.g. `http://localhost:2000`)

## Usage

### View media

View media based on a specified pathname

`GET {BASE_URL}/path/to/file` or `GET {BASE_URL}/media/path/to/file`

### Get folder contents

Get all children based on a specified folder/pathname

`GET {BASE_URL}/from-dir/path/to/dir` or `GET {BASE_URL}/from-dir/path.to.dir`

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)