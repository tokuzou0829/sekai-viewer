import {
  Typography,
  Container,
  Grid,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  useTheme,
  InputAdornment,
  Tooltip,
} from "@material-ui/core";
import { Check, Clear, Create } from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-material-ui";
import { Upload, Logout } from "mdi-material-ui";
import React, { Fragment, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../context";
import { useInteractiveStyles } from "../../styles/interactive";
import { useLayoutStyles } from "../../styles/layout";
import { useStrapi } from "../../utils/apiClient";
import { CardThumbMedium } from "../subs/CardThumb";
// import useJwtAuth from "../../utils/jwt";
import BindSekaiID from "./subs/BindSekaiID";

const UserHome: React.FC<{}> = () => {
  const theme = useTheme();
  const layoutClasses = useLayoutStyles();
  const interactiveClasses = useInteractiveStyles();
  const { t } = useTranslation();
  const history = useHistory();
  // const jwtAuth = useJwtAuth();
  // const { user, token } = useJwtAuth();
  const {
    user,
    jwtToken,
    sekaiProfile,
    updateUser,
    logout,
    usermeta,
    updateUserMeta,
  } = useContext(UserContext)!;
  const {
    getUserMe,
    postUpload,
    putUserMetadataMe,
    getUserMetadataMe,
  } = useStrapi(jwtToken);
  // let { path } = useRouteMatch();

  const [isUploadAvatarError, setIsUploadAvatarError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    usermeta ? (usermeta.avatar || { url: "" }).url : ""
  );
  const [nickname, setNickname] = useState(usermeta?.nickname || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isShowEmail, setIsShowEmail] = useState(false);

  useEffect(() => {
    document.title = t("title:user_home");
  }, [t]);

  return (
    <Fragment>
      <Typography variant="h6" className={layoutClasses.header}>
        {t("common:user")}
      </Typography>
      <Container maxWidth="md">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12} container justify="center">
                <Avatar
                  src={avatarUrl || ""}
                  className={layoutClasses.avatarProfile}
                >
                  {(nickname || "").substr(0, 2).toUpperCase()}
                </Avatar>
              </Grid>
              <Grid item xs={12} container justify="center">
                <input
                  accept="image/png,image/jpeg"
                  className={interactiveClasses.inputHidden}
                  id="upload-avatar-button"
                  type="file"
                  onChange={(e) => {
                    if (!e.target.files || !e.target.files.length) return;
                    const file = e.target.files.item(0);
                    if (!file?.type.startsWith("image/")) return;

                    const form = new FormData();
                    form.append("files", file);
                    form.append("refId", String(usermeta?.id));
                    form.append("ref", "user-metadata");
                    form.append("field", "avatar");

                    const oldUrl = avatarUrl;
                    setIsUploading(true);
                    setAvatarUrl("");
                    postUpload(form)
                      .then(() => {
                        // update user data
                        return getUserMetadataMe();
                      })
                      .then((data) => {
                        // jwtAuth.user = data;
                        updateUserMeta(data);
                        setAvatarUrl(data.avatar.url);
                        setIsUploading(false);
                      })
                      .catch(() => {
                        setIsUploadAvatarError(true);
                        setIsUploading(false);
                        setAvatarUrl(oldUrl);
                      });

                    e.target.value = "";
                  }}
                />
                <label htmlFor="upload-avatar-button">
                  <Button
                    variant="outlined"
                    component="span"
                    disabled={isUploading}
                    startIcon={<Upload />}
                  >
                    {t("user:profile.upload_avatar")}
                    {isUploading && <CircularProgress size={16} />}
                  </Button>
                </label>
              </Grid>
              <Grid item xs={12} container justify="center">
                <Button
                  onClick={() => {
                    logout();
                    history.replace("/user/login");
                  }}
                  variant="outlined"
                  color="secondary"
                  startIcon={<Logout />}
                >
                  {t("auth:logout")}
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Grid container justify="space-between">
                  <Typography className={layoutClasses.bold}>
                    {t("user:profile.username")}
                  </Typography>
                  <Typography>{user?.username}</Typography>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Grid container justify="space-between" alignItems="center">
                  <Typography className={layoutClasses.bold}>
                    {t("user:profile.nickname")}
                    <IconButton
                      size="small"
                      onClick={() => setIsEditingNickname((state) => !state)}
                    >
                      <Create />
                    </IconButton>
                  </Typography>
                  {isEditingNickname ? (
                    <Formik
                      initialValues={{ nickname }}
                      onSubmit={async (values, { setErrors }) => {
                        try {
                          await putUserMetadataMe(usermeta!.id, {
                            nickname: values.nickname,
                          });
                          setNickname(values.nickname);
                          setIsEditingNickname(false);
                          updateUser(await getUserMe());
                          updateUserMeta(await getUserMetadataMe());
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                    >
                      {({ submitForm, isSubmitting }) => (
                        <Fragment>
                          <Form>
                            <Field
                              component={TextField}
                              name="nickname"
                              type="text"
                              // label={t("auth:profile.nickname")}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      size="small"
                                      onClick={() => submitForm()}
                                      disabled={isSubmitting}
                                    >
                                      <Check />{" "}
                                      {isSubmitting && (
                                        <CircularProgress size="inherit" />
                                      )}
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setIsEditingNickname(false)
                                      }
                                    >
                                      <Clear />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            ></Field>
                            <input type="submit" style={{ display: "none" }} />
                          </Form>
                        </Fragment>
                      )}
                    </Formik>
                  ) : (
                    <Typography>{nickname}</Typography>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Grid container justify="space-between">
                  <Typography className={layoutClasses.bold}>
                    {t("user:profile.role")}
                  </Typography>
                  <Tooltip title={user?.role.description || ""} arrow>
                    <Typography>{user?.role.name}</Typography>
                  </Tooltip>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Grid container justify="space-between" alignItems="center">
                  <Typography className={layoutClasses.bold}>
                    {t("user:profile.email")}
                  </Typography>
                  {isShowEmail ? (
                    <Typography>{user?.email}</Typography>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setIsShowEmail(true)}
                    >
                      {t("user:profile.button.show_email")}
                    </Button>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Grid container justify="space-between">
                  <Typography className={layoutClasses.bold}>
                    {t("user:profile.email_confirmed")}
                  </Typography>
                  <Typography
                    style={{
                      color: user?.confirmed
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    }}
                  >
                    {t(
                      `user:profile.email_confirmed_status.${user?.confirmed}`
                    )}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Grid container justify="space-between" alignItems="center">
                  <Grid item xs={3}>
                    <Typography className={layoutClasses.bold}>
                      {t("user:profile.sekai_id")}
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <BindSekaiID />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {/* {JSON.stringify(user)} */}
      </Container>
      {sekaiProfile && sekaiProfile.sekaiUserProfile && (
        <Fragment>
          <Typography variant="h6" className={layoutClasses.header}>
            {t("user:profile.title.user_deck")}
          </Typography>
          <Container>
            <Grid container spacing={2} justify="center">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Grid item xs={4} md={2} key={`user-deck-${idx}`}>
                  <CardThumbMedium
                    cardId={
                      sekaiProfile.sekaiUserProfile!.userDecks[0][
                        `member${idx + 1}` as "member1"
                      ]
                    }
                    trained={
                      sekaiProfile.sekaiUserProfile!.userCards.find(
                        (card) =>
                          card.cardId ===
                          sekaiProfile.sekaiUserProfile!.userDecks[0][
                            `member${idx + 1}` as "member1"
                          ]
                      )!.defaultImage === "special_training"
                    }
                    cardLevel={
                      sekaiProfile.sekaiUserProfile!.userCards.find(
                        (card) =>
                          card.cardId ===
                          sekaiProfile.sekaiUserProfile!.userDecks[0][
                            `member${idx + 1}` as "member1"
                          ]
                      )!.level
                    }
                    masterRank={
                      sekaiProfile.sekaiUserProfile!.userCards.find(
                        (card) =>
                          card.cardId ===
                          sekaiProfile.sekaiUserProfile!.userDecks[0][
                            `member${idx + 1}` as "member1"
                          ]
                      )!.masterRank
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Fragment>
      )}
      <Snackbar
        open={isUploadAvatarError}
        autoHideDuration={3000}
        onClose={() => setIsUploadAvatarError(false)}
      >
        <Alert onClose={() => setIsUploadAvatarError(false)} severity="error">
          {t("user:profile.upload_avatar_error")}
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default UserHome;
