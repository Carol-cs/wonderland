import React from "react";
import { useState, useEffect } from "react";
import Player from "./Player";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Form } from "react-bootstrap";
import spotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import useAuth from "./useAuth";

const spotifyApi = new spotifyWebApi({
  clientId: "6cc0e292d788486f86dde792708ea249",
});

const Dashboard = () => {
  const code = new URLSearchParams(window.location.search).get("code");
  const { accessToken, logout } = useAuth(code);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const country = new URLSearchParams(window.location.search).get("country");
  const mood = new URLSearchParams(window.location.search).get("mood");

  function chooseTrack(track) {
    setPlayingTrack(track);
    setLyrics("");
  }

  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get("http://localhost:5010/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics);
      });
  }, [playingTrack]);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    // if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false; // used to cancel the previous query when a new query is made
    // spotifyApi.getNewReleases({ country: country }).then((res) => {
    //   if (cancel) return;
    //   setSearchResults(
    //     res.body.albums.items.map((album) => {
    //       const smallestAlbumImage = album.images.reduce(
    //         // get the smallest image for the album
    //         (smallest, image) => {
    //           if (image.height < smallest.height) return image;
    //           return smallest;
    //         },
    //         album.images[0]
    //       );

    //       return {
    //         artist: album.artists[0].name,
    //         title: album.name,
    //         uri: album.uri,
    //         albumUrl: smallestAlbumImage.url,
    //       };
    //     })
    //   );
    // });
    spotifyApi.getNewReleases({ country: country }).then((res) => {
      if (cancel) return;
      const albumIds = res.body.albums.items.map((album) => album.id);

      // Search tracks for each album
      const trackPromises = albumIds.map((albumId) =>
        spotifyApi.searchTracks(`${mood}`)
      );

      Promise.all(trackPromises).then((trackResults) => {
        const tracks = trackResults.flatMap(
          (result) => result.body.tracks.items
        );

        setSearchResults(
          tracks.map((track) => {
            const smallestAlbumImage = track.album.images.reduce(
              // get the smallest image for the album
              (smallest, image) => {
                if (image.height < smallest.height) return image;
                return smallest;
              },
              track.album.images[0]
            );

            return {
              artist: track.artists[0].name,
              title: track.name,
              uri: track.uri,
              albumUrl: smallestAlbumImage.url,
            };
          })
        );
      });
    });

    return () => (cancel = true);
  }, [accessToken]);

  return (
    <Container className="flex flex-col py-2 h-screen">
      <div className="items-center">
        {accessToken && (
          <button
            onClick={logout}
            className="bg-red-500 border-none p-2 rounded-lg text-white "
          >
            Logout
          </button>
        )}
      </div>
      <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
          />
        ))}
        {searchResults.length === 0 && (
          <div className="text-center" style={{ whiteSpace: "pre" }}>
            {lyrics}
          </div>
        )}
      </div>
      <div>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </Container>
  );
};

export default Dashboard;
