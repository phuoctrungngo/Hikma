import React, { Component, useState, useEffect } from "react";
import { View, Text, Image, TextInput, FlatList, StyleSheet, TouchableOpacity, ImageBackground, ImageBackgroundBase, Button, Alert } from "react-native";
import { database } from "../database/Database";
import styles from './Style';
import { uuid } from "uuidv4";
import { EventTypes } from "../enums/EventTypes";
import { iconHash } from '../services/hash'
import { User } from "../types/User";

const PatientView = (props) => {

  const [patient, setPatient] = useState(props.navigation.getParam('patient'));
  const [language, setLanguage] = useState(props.navigation.getParam('language', 'en'));
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [userName, setUserName] = useState('');
  const [summary, setSummary] = useState('no content yet')
  const clinicId = props.navigation.state.params.clinicId;
  const userId = props.navigation.state.params.userId;

  useEffect(() => {
    setPatient(props.navigation.state.params.patient);
    let patientId = props.navigation.state.params.patient.id;
    database.getLatestPatientEventByType(patientId, EventTypes.PatientSummary).then((response: string) => {
      if (response.length > 0) {
        setSummary(response)
      }
    })
  }, [props])

  useEffect(() => {
    database.getUser(userId).then((user: User) => {
      if (!!user.name.content[language]) {
        setUserName(user.name.content[language])
      } else {
        setUserName(user.name.content[Object.keys(user.name.content)[0]])
      }
    })
  }, [])

  const LanguageToggle = () => {
    return (
      <TouchableOpacity onPress={() => {
        if (language === 'en') {
          setLanguage('ar')
        } else {
          setLanguage('en')
        }
      }}>
        <Text style={styles.text}>{language}</Text>
      </TouchableOpacity>
    )
  }

  const displayName = (patient) => {
    if (!!patient.given_name.content[language] && !!patient.surname.content[language]) {
      return <Text>{`${patient.given_name.content[language]} ${patient.surname.content[language]}`}</Text>
    } else {
      patient.given_name.content[Object.keys(patient.given_name.content)[0]]
      return <Text>{`${patient.given_name.content[Object.keys(patient.given_name.content)[0]]} ${patient.surname.content[Object.keys(patient.surname.content)[0]]}`}</Text>
    }
  }

  const getPatientAge = (dob: string) => {
    let birthdate = new Date(dob)
    let ageDifMs = Date.now() - birthdate.getTime();
    let ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  const handleSaveSummary = () => {
    database.addEvent({
      id: uuid(),
      patient_id: patient.id,
      visit_id: null,
      event_type: EventTypes.PatientSummary,
      event_metadata: summary
    }).then(() => console.log('patient summary saved'))
  }

  return (
    <View style={styles.main}>
      <View style={styles.viewContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => props.navigation.navigate('PatientList', { language: language, reloadPatientsToggle: !props.navigation.state.params.reloadPatientsToggle })}>
            <Text style={{ margin: 20 }}>{`< PATIENTS`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => props.navigation.navigate('EditPatient', { language: language, patient: patient })}>
            <Text style={{ margin: 20 }}>{`Edit`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <ImageBackground source={{ uri: iconHash(patient.id) }} style={{ width: 100, height: 105, justifyContent: 'center' }}>
            {/* <View style={styles.hexagon}>
              <View style={styles.hexagonInner} />
              <View style={styles.hexagonBefore} />
              <View style={styles.hexagonAfter} />
            </View> */}
          </ImageBackground>

          <View>
            {displayName(patient)}
            <View
              style={{
                marginVertical: 5,
                borderBottomColor: 'black',
                borderBottomWidth: 1,
              }}
            />
            <Text>{`Date of birth:  ${patient.date_of_birth}`}</Text>
            <Text>{`Sex:  ${patient.sex}`}</Text>
          </View>
        </View>
        <View style={styles.buttonBar}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Alert.alert(
                'Under construction',
                '',
                [
                  { text: 'OK' },
                ],
              );
            }}>
            <Text style={{ color: '#31BBF3' }}>TRENDS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Alert.alert(
                'Under construction',
                '',
                [
                  { text: 'OK' },
                ],
              );
            }}>
            <Text style={{ color: '#31BBF3' }}>VISIT HISTORY</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>{patient.date_of_birth}</Text>
            <Text style={styles.gridItemLabel}>DOB</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>{getPatientAge(patient.date_of_birth)}</Text>
            <Text style={styles.gridItemLabel}>AGE</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>{patient.sex}</Text>
            <Text style={styles.gridItemLabel}>GENDER</Text>
          </View>
        </View>
        <View>
          <Text style={[styles.gridItemLabel, styles.title]}>Patient Summary</Text>
          <TouchableOpacity onLongPress={() => setIsEditingSummary(true)}>
            {isEditingSummary ?
              <View>
                <TextInput
                  style={styles.paragraph}
                  placeholder="First Name"
                  onChangeText={setSummary}
                  value={summary}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    handleSaveSummary();
                    setIsEditingSummary(false);
                  }}>
                  <Text style={{ color: '#31BBF3' }}>SAVE</Text>
                </TouchableOpacity>
              </View> :
              <Text style={styles.paragraph}>
                {summary}
              </Text>}
          </TouchableOpacity>

        </View>
        <View style={styles.newVisit}>
          <TouchableOpacity onPress={() => {
            const newVisitId = uuid();
            database.addVisit({
              id: newVisitId,
              patient_id: patient.id,
              clinic_id: clinicId,
              provider_id: userId
            })
            props.navigation.navigate('NewVisit',
              {
                language: language,
                patient: patient,
                visitId: newVisitId.replace(/-/g, ""),
                userName: userName
              }
            )
          }}>
            <Image source={require('../images/newVisit.png')} style={{ width: 75, height: 75 }} />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  )

}

export default PatientView;