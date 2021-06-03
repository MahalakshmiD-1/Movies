const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Returns a list of all movie names in the movie table

app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `SELECT movie_name FROM movie`;
  const MoviesListResult = await database.all(getMovieNamesQuery);
  response.send(
    MoviesListResult.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//Creates a new movie in the movie table. movie_id is auto-incremented
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;

  const CreateNewMovieQuery = `
  INSERT INTO
   movie (director_id,movie_name,lead_actor)
   VALUES
    (${directorId},'${movieName}','${leadActor}');`;
  await database.run(CreateNewMovieQuery);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const GetMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`;
  const MovieResult = await database.get(GetMovieQuery);
  response.send(convertMovieDbObjectToResponseObject(MovieResult));
});

//Updates the details of a movie in the movie table based on the movie ID

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const UpdateMovieQuery = `UPDATE movie SET director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
    WHERE movie_id=${movieId}`;
  await database.run(UpdateMovieQuery);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const DeleteMovieQuery = `DELETE FROM movie WHERE movie_id=${movieId}`;
  await database.run(DeleteMovieQuery);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`;
  const directorsArray = await database.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

//Returns a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieDirectorQuery = `SELECT movie_name FROM movie WHERE director_id=${directorId};`;
  const DirectorResult = await database.all(getMovieDirectorQuery);
  response.send(
    DirectorResult.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
