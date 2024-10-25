import { Box } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import { omit } from "lodash-es";
import { DropzoneArea } from "material-ui-dropzone";
import MaterialTable from "material-table";
import Container from "@material-ui/core/Container";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  m3uDataState,
  m3uFilenameState,
  m3uOriginalState,
} from "../localStore";
import { M3uParser, M3uPlaylist } from "m3u-parser-generator";
import LogoAutocomplete from "./LogoAutocomplete";
import { useStyles } from "./styles";
import arrayMove from "array-move";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

const changeEnabledState = (
  newState, // null = toggle
  m3uData,
  reSortData,
  setWorkaround,
  tableRef
) => (evt, data) => {
  let rows = m3uData.rows;
  const length = rows.length;
  data.forEach((d) => {
    const index = rows.indexOf(d);
    d.enabled = newState === null ? !d.enabled : newState;
    rows[index] = d;
    rows = arrayMove(rows, index, length);
    rows = reSortData(rows);
  });
  setWorkaround({
    data: { rows },
    resolve: () => {},
  });
  tableRef.current.onAllSelected(false);
};

const M3U = (props) => {
  const classes = useStyles();

  let fileReader;

  const inputRef = useRef();
  const tableRef = useRef();

  const [m3uFilename, setM3uFilename] = m3uFilenameState(null);
  const [m3uOriginal, setM3uOriginal] = m3uOriginalState(null);
  const [m3uData, setM3uData] = m3uDataState(null);
  const [columns, setColumns] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Math.random());

  // https://github.com/mbrn/material-table/issues/1325
  const [workaround, setWorkaround] = useState({
    data: null,
    resolve: null,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const handleDeleteAll = () => {
    setM3uOriginal(null);
    setM3uData(null);
    setColumns(null);
    setM3uFilename(null);
    setRefreshKey(Math.random());
    setConfirmOpen(false);
  };

  const readFile = (e) => {
    const content = fileReader.result;
    const result = M3uParser.parse(content);
    if (result) {
      setM3uOriginal(result);
    }
  };

  const newFile = (e) => {
    if (!e.length) return;
    fileReader = new FileReader();
    fileReader.onloadend = readFile;
    fileReader.readAsText(e[0]);
    setM3uFilename(e[0].name);
  };

  const setupTableColumns = useCallback(() => {
    const columnsSet = new Set();
    columnsSet.add("sort");
    columnsSet.add("enabled");
    columnsSet.add("name");
    columnsSet.add("group");

    const columnsArray = [];
    columnsSet.forEach((column) => {
      if (column === "sort") {
        columnsArray.push({
          title: column,
          field: column,
          defaultSort: "asc",
        });
      } else if (column === "enabled") {
        columnsArray.push({
          title: column,
          field: column,
          type: "boolean",
        });
      } else if (column === "tvgLogo") {
        columnsArray.push({
          title: column,
          field: column,
          render: (rowData) => (
            <img src={rowData.tvgLogo} style={{ width: 70 }} alt="tvgLogo" />
          ),
          editComponent: (props) => (
            <LogoAutocomplete
              value={props.value}
              onChange={(e) => props.onChange(e)}
            />
          ),
        });
      } else {
        columnsArray.push({
          title: column,
          field: column,
        });
      }
    });
    setColumns(columnsArray);
  }, []);

  const setupTableData = useCallback(() => {
    const dataArray = [];
    m3uOriginal.medias.forEach((media, idx) => {
      dataArray.push({
        sort: idx + 1,
        enabled: true,
        url: media.location,
        ...media,
      });
    });
    setM3uData({ rows: dataArray });
  }, [m3uOriginal, setM3uData]);

  const reSortData = (data) => {
    return data.map((d, idx) => {
      d.sort = idx + 1;
      return d;
    });
  };

  const onRowAdd = (newData) =>
    new Promise((resolve, reject) => {
      let data = m3uData.rows;
      data.push(newData);
      data = reSortData(data);
      setWorkaround({ data: { rows: data }, resolve: resolve });
    });

  const onRowDelete = (oldData) =>
    new Promise((resolve, reject) => {
      let data = m3uData.rows;
      const index = data.indexOf(oldData);
      data.splice(index, 1);
      data = reSortData(data);
      setWorkaround({ data: { rows: data }, resolve: resolve });
    });

  const onRowUpdate = (newData, oldData) =>
    new Promise((resolve, reject) => {
      let data = m3uData.rows;
      const index = data.indexOf(oldData);
      data[index] = newData;
      if (parseInt(newData.sort, 10) !== parseInt(oldData.sort, 10)) {
        data = arrayMove(
          data,
          parseInt(oldData.sort, 10) - 1,
          parseInt(newData.sort, 10) - 1
        );
        data = reSortData(data);
      }
      setWorkaround({ data: { rows: data }, resolve: resolve });
    });

  const exportFile = (dataType, fileName, data) => {
    if (window.navigator.msSaveOrOpenBlob) {
      const blob = new Blob([data]);
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const charBom = "\uFEFF";
      const encodedData = encodeURIComponent(data);
      let content = `data:text/${dataType};charset=utf-8,${charBom}${encodedData}`;

      const link = document.createElement("a");
      link.setAttribute("href", content);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);

      link.click();
    }
  };

  const exportFunction = (columns, data) => {
    let content = "#EXTM3U\r\n"; // start of the file
    data.forEach((row) => {
      const enabled = row.enabled ? "" : "# ";
      content += `${enabled}#EXTINF:${row.duration},${row.name}\r\n#EXTGRP:${row.group}\r\n${enabled}${row.location}\r\n`;
    });
    exportFile("plain", `new_${m3uFilename}`, content);
  };

  useEffect(() => {
    if (m3uOriginal) {
      setupTableColumns();
    }
  }, [m3uOriginal, setupTableColumns]);

  useEffect(() => {
    if (m3uOriginal && !m3uData) {
      setupTableData();
    }
  }, [m3uOriginal, m3uData, setupTableData]);

  useEffect(() => {
    if (workaround.data) {
      setM3uData(workaround.data);
      workaround.resolve();
      setRefreshKey(Math.random());
    }
  }, [setM3uData, workaround]);

  const downloadSpecificChannels = useCallback(() => {
    const filteredMediasSet = new Set();
    const playlist = new M3uPlaylist();
    const toKeep = inputRef.current.value?.split(",");
    m3uOriginal.medias.forEach((media) => {
      if (
        toKeep.some(
          (item) =>
            media.name.toLowerCase().includes(item.toLowerCase()) &&
            !filteredMediasSet.has(media.location)
        )
      ) {
        filteredMediasSet.add(media.location);
        playlist.medias.push(omit(media, ["kodiProps"]));
      }
    });
    exportFile("plain", `new_${m3uFilename}`, playlist.getM3uString());
  }, [m3uFilename, m3uOriginal]);

  return (
    <>
      <Container className={classes.root}>
        {!m3uOriginal && (
          <Box maxWidth={500} ml={"auto"} mr={"auto"} mt={10}>
            <DropzoneArea
              onChange={newFile}
              acceptedFiles={["audio/x-mpegurl", "audio/mpegurl"]}
              filesLimit={1}
              dropzoneText="------ Upload a file or enter a url instead ------"
              useChipsForPreview
            />
          </Box>
          // TODO: add a url field which gets the file
        )}
        {m3uData && columns && (
          <Box>
            <Box display="flex" alignItems="center" gridGap={20} pt={2} pb={2}>
              <TextField
                label="Keep only (A,B,C,D...)"
                variant="outlined"
                fullWidth
                inputRef={inputRef}
                placeholder="кино,тнт,стс,TV1000,TV 1000,Amedia,Мосфильм,Премиальное,VHS,Комед,comed,квн,коломбо,Первый HD,VIP Premiere,Megahit,Viasat,Nat Geo,Animal Planet,Русский иллюзион,Paramount Comedy,Камеди,Драйв,Авто,Hits,детектив,бестселлер,Кухня,животны,планет,Discovery,Viasat,Морской,юмор,Хит,Блокбастер,МУЗ-ТВ,Russian Music,Europa Plus,BRIDGE TV,MTV,Mezzo,Music Box"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={downloadSpecificChannels}
                className={classes.button}
              >
                Keep
              </Button>
            </Box>
            <MaterialTable
              key={refreshKey}
              tableRef={tableRef}
              title={`file: ${m3uFilename}`}
              columns={columns}
              data={m3uData.rows}
              options={{
                padding: "dense",
                pageSize: 100,
                draggable: false,
                pageSizeOptions: [50, 100, 200, 500],
                exportButton: true,
                exportCsv: exportFunction,
                filtering: true,
                search: false,
                selection: true,
                sorting: true,
              }}
              actions={[
                {
                  tooltip: "Remove Selected",
                  icon: "delete",
                  onClick: (evt, data) => {
                    let rows = m3uData.rows;
                    data.forEach((d) => {
                      const index = rows.indexOf(d);
                      rows.splice(index, 1);
                    });
                    rows = reSortData(rows);
                    setWorkaround({
                      data: { rows: rows },
                      resolve: () => {},
                    });
                  },
                },
                {
                  tooltip: "Enable Selected",
                  icon: "toggle_on",
                  onClick: changeEnabledState(
                    true,
                    m3uData,
                    reSortData,
                    setWorkaround,
                    tableRef
                  ),
                },
                {
                  tooltip: "Disable Selected",
                  icon: "toggle_off",
                  onClick: changeEnabledState(
                    false,
                    m3uData,
                    reSortData,
                    setWorkaround,
                    tableRef
                  ),
                },
                {
                  tooltip: "Toggle disable state",
                  icon: "published_with_changes",
                  onClick: changeEnabledState(
                    null,
                    m3uData,
                    reSortData,
                    setWorkaround,
                    tableRef
                  ),
                },
                {
                  icon: "delete-forever",
                  tooltip: "Remove Everything",
                  isFreeAction: true,
                  onClick: (event, rowData) => {
                    setConfirmOpen(true);
                  },
                },
              ]}
              localization={{
                toolbar: {
                  exportName: "Save new file",
                },
              }}
              detailPanel={(rowData) => {
                return (
                  <>
                    <p>URL: {rowData.location}</p>
                    <p>Name: {rowData.name}</p>
                    <p>Group: {rowData.group}</p>
                    <p>Duration: {rowData.duration}</p>
                  </>
                );
              }}
              editable={{
                isEditable: (rowData) => true,
                isDeletable: (rowData) => true,
                onRowAdd: onRowAdd,
                onRowUpdate: onRowUpdate,
                onRowDelete: onRowDelete,
              }}
            />
          </Box>
        )}
      </Container>
      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete everything</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will delete everything and let you start afresh. Are your sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAll} color="primary" autoFocus>
            Delete everything
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default M3U;
