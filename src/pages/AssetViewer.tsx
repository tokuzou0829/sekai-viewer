import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useLayoutStyles } from "../styles/layout";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
  Backdrop,
  CircularProgress,
  Breadcrumbs,
  Link,
  BreadcrumbsProps,
  Dialog,
  DialogTitle,
  DialogProps,
  DialogContent,
  IconButton,
} from "@mui/material";
import { XMLParser } from "fast-xml-parser";
import { IListBucketResult } from "../types";
import { CloudDownload, Folder, OpenInNew } from "@mui/icons-material";
import ArrowUpLeftBold from "~icons/mdi/arrow-up-left-bold";
import FileCodeOutline from "~icons/mdi/file-code-outline";
import FileImage from "~icons/mdi/file-image";
import FileVideo from "~icons/mdi/file-video";
import FileMusic from "~icons/mdi/file-music";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { useToggle } from "../utils";
import Image from "mui-image";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import AudioPlayer from "./music/AudioPlayer";
import { saveAs } from "file-saver";
import { useInteractiveStyles } from "../styles/interactive";

const AssetListDirectory: React.FC<{
  prefix: string;
}> = ({ prefix }) => {
  return (
    <ListItemButton component={RouterLink} to={`/asset_viewer/${prefix}`}>
      <ListItemAvatar>
        <Avatar>
          <Folder />
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={prefix.split("/").slice(-2)[0]} />
    </ListItemButton>
  );
};

const AssetListFile: React.FC<{
  fileInfo: {
    Key: string;
    LastModified: string;
    Size: number;
  };
  onClick: (filePath: string) => void;
}> = ({ fileInfo, onClick }) => {
  const fileIconMap: {
    [key: string]: React.ReactElement;
  } = {
    png: <FileImage fontSize="32" color="inherit" />,
    webp: <FileImage fontSize="32" color="inherit" />,
    jpg: <FileImage fontSize="32" color="inherit" />,
    mp4: <FileVideo fontSize="32" color="inherit" />,
    mp3: <FileMusic fontSize="32" color="inherit" />,
    flac: <FileMusic fontSize="32" color="inherit" />,
  };

  return (
    <ListItemButton onClick={() => onClick(fileInfo.Key)}>
      <ListItemAvatar>
        {fileIconMap[
          fileInfo.Key.split("/").slice(-1)[0].split(".").slice(-1)[0]
        ] || <FileCodeOutline fontSize="32" color="inherit" />}
      </ListItemAvatar>
      <ListItemText primary={fileInfo.Key.split("/").slice(-1)[0]} />
    </ListItemButton>
  );
};

const AssetListItems: React.FC<{
  parentPath: string;
  folders: IListBucketResult["CommonPrefixes"];
  files: IListBucketResult["Contents"];
  isRoot: boolean;
  hasContinue: boolean;
  // onFolderClick: (prefix: string) => void;
  onFileClick: (filePath: string) => void;
  onContinue: (entries: readonly IntersectionObserverEntry[]) => void;
}> = ({
  parentPath,
  folders,
  files,
  isRoot,
  hasContinue,
  onFileClick,
  onContinue,
}) => {
  const { t } = useTranslation();

  const observerCallback = useCallback(
    (entries: readonly IntersectionObserverEntry[]) => onContinue(entries),
    [onContinue]
  );
  const listElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentObserver = new IntersectionObserver(observerCallback, {
      threshold: 0.5,
    });
    const currentElement = listElementRef.current;
    if (currentElement) currentObserver.observe(currentElement);

    return () => {
      if (currentElement) {
        currentObserver.disconnect();
      }
    };
  }, [observerCallback]);

  return (
    <Fragment>
      {!isRoot && (
        <ListItemButton
          component={RouterLink}
          to={`/asset_viewer/${parentPath}`}
        >
          <ListItemAvatar>
            <Avatar>
              <ArrowUpLeftBold />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={t("asset_viewer:parentFolder")} />
        </ListItemButton>
      )}
      {(folders || []).map((CommonPrefix) => (
        <AssetListDirectory
          prefix={CommonPrefix.Prefix}
          key={CommonPrefix.Prefix}
        />
      ))}
      {(files || []).map((Content) => (
        <AssetListFile
          fileInfo={Content}
          onClick={onFileClick}
          key={Content.Key}
        />
      ))}
      {hasContinue && (
        <ListItemButton ref={listElementRef}>
          <ListItemText primary="Loading More..." />
        </ListItemButton>
      )}
    </Fragment>
  );
};

const AssetPreview: React.FC<{ filePath: string } & DialogProps> = ({
  filePath,
  ...props
}) => {
  const url = useMemo(
    () => `${import.meta.env.VITE_ASSET_DOMAIN_MINIO}/sekai-assets/${filePath}`,
    [filePath]
  );
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (filePath.endsWith("asset")) {
      axios.get(url, { responseType: "json" }).then((res) => setData(res.data));
    }
    return () => {
      setData(null);
    };
  }, [filePath, url]);

  return (
    <Dialog {...props} fullWidth maxWidth="md">
      <DialogTitle>
        {filePath.split("/").slice(-1)[0]}
        <IconButton component="a" href={url} target="_blank">
          <OpenInNew />
        </IconButton>
        <IconButton
          onClick={() => {
            saveAs(url, filePath.split("/").slice(-1)[0]);
          }}
        >
          <CloudDownload />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {filePath.endsWith("png") ||
        filePath.endsWith("webp") ||
        filePath.endsWith("jpg") ? (
          <Image src={url} bgColor="" showLoading />
        ) : filePath.endsWith("asset") ? (
          data === null ? (
            <CircularProgress size={32} />
          ) : (
            <JsonView data={data} shouldInitiallyExpand={() => false} />
          )
        ) : filePath.endsWith("mp4") ? (
          <video src={url} controls style={{ width: "100%" }} />
        ) : filePath.endsWith("mp3") || filePath.endsWith("flac") ? (
          <AudioPlayer src={url} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const Breadcrumb: React.FC<{ paths: string[] } & BreadcrumbsProps> = ({
  paths,
  ...props
}) => {
  const interactiveClasses = useInteractiveStyles();
  const { t } = useTranslation();

  return (
    <Breadcrumbs {...props}>
      {paths.length && paths[0] !== "" ? (
        <RouterLink
          className={interactiveClasses.noDecoration}
          color="inherit"
          to="/asset_viewer/"
        >
          {t("asset_viewer:root")}
        </RouterLink>
      ) : (
        <Typography color="text.primary">{t("asset_viewer:root")}</Typography>
      )}
      {paths
        .filter((path) => path !== "")
        .map((path, idx, arr) =>
          idx === arr.length - 1 ? (
            <Typography color="text.primary">{path}</Typography>
          ) : (
            <RouterLink
              className={interactiveClasses.noDecoration}
              color="inherit"
              to={`/asset_viewer/${arr.slice(0, idx + 1).join("/")}`}
            >
              {path}
            </RouterLink>
          )
        )}
    </Breadcrumbs>
  );
};

const AssetViewer = () => {
  const layoutClasses = useLayoutStyles();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const parser = useMemo(
    () =>
      new XMLParser({
        isArray: (name, jpath) => {
          if (["CommonPrefixes", "Contents"].includes(name)) return true;
          return false;
        },
      }),
    []
  );

  const [folderPath, setFolderPath] = useState<string[]>(
    pathname.split("/").slice(2)
  );
  const [commonPrefixes, setCommonPrefixes] = useState<
    IListBucketResult["CommonPrefixes"]
  >([]);
  const [contents, setContents] = useState<IListBucketResult["Contents"]>([]);
  const [continuationToken, setContinuationToken] = useState<
    string | undefined
  >(undefined);
  const [isFetching, setIsFetching] = useState(false);
  const [dialogOpen, toggleDialogOpen] = useToggle(false);
  const [previewFilePath, setPreviewFilePath] = useState("");

  useEffect(() => {
    document.title = t("title:assetViewer");
  }, [t]);

  const fetchStructure = useCallback(
    async (path: string, token?: string): Promise<IListBucketResult> => {
      const baseURL = import.meta.env.VITE_ASSET_DOMAIN_MINIO;
      const result = (
        await axios.get<string>(`/sekai-assets/`, {
          baseURL,
          params: {
            "list-type": "2",
            delimiter: "/",
            prefix: path,
            "max-keys": "100",
            "continuation-token": token,
          },
          responseType: "text",
        })
      ).data;

      return parser.parse(result).ListBucketResult;
    },
    [parser]
  );

  useEffect(() => {
    setIsFetching(true);
    const path = pathname.split("/").slice(2);
    setFolderPath(path);
    let url = path.join("/");
    if (!url.endsWith("/")) url += "/";
    fetchStructure(url).then((data) => {
      // console.log(data);
      setCommonPrefixes(data.CommonPrefixes);
      setContents(data.Contents);
      if (data.NextContinuationToken) {
        setContinuationToken(data.NextContinuationToken);
      }
      setIsFetching(false);
    });
  }, [fetchStructure, pathname]);

  return (
    <Fragment>
      <Typography variant="h6" className={layoutClasses.header}>
        {t("common:assetViewer")}
      </Typography>
      <Alert severity="warning" className={layoutClasses.alert}>
        {t("common:betaIndicator")}
      </Alert>
      <Breadcrumb paths={folderPath} className={layoutClasses.content} />
      <Paper
        variant="outlined"
        className={layoutClasses.backdropParent}
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Backdrop className={layoutClasses.componentBackdrop} open={isFetching}>
          <CircularProgress color="inherit" />
        </Backdrop>
        <List
          sx={{
            width: "100%",
            maxHeight: "calc(100vh - 248px)",
            overflowY: "auto",
          }}
          component="nav"
        >
          {!isFetching && (
            <AssetListItems
              parentPath={
                !folderPath.length
                  ? "/"
                  : folderPath.slice(-1)[0] === ""
                  ? folderPath.slice(0, -2).join("/")
                  : folderPath.slice(0, -1).join("/")
              }
              folders={commonPrefixes}
              files={contents}
              isRoot={!folderPath.length || folderPath[0] === ""}
              // onFolderClick={(prefix) => setFolderPath(prefix.split("/"))}
              onFileClick={(filePath) => {
                setPreviewFilePath(filePath);
                toggleDialogOpen();
              }}
              hasContinue={!!continuationToken}
              onContinue={async (entries) => {
                if (entries.find((entry) => entry.isIntersecting)) {
                  // setContinuationToken(undefined);
                  let url = folderPath.join("/");
                  if (!url.endsWith("/")) url += "/";
                  const data = await fetchStructure(url, continuationToken);
                  setCommonPrefixes((cps) => [
                    ...(cps || []),
                    ...(data.CommonPrefixes || []),
                  ]);
                  setContents((cts) => [
                    ...(cts || []),
                    ...(data.Contents || []),
                  ]);
                  setContinuationToken(data.NextContinuationToken);
                }
              }}
            />
          )}
        </List>
      </Paper>
      <AssetPreview
        filePath={previewFilePath}
        open={dialogOpen}
        onClose={() => toggleDialogOpen()}
      />
    </Fragment>
  );
};

export default AssetViewer;