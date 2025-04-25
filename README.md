# Chronometric Action-based Robotic Logic Simulator

## Overview
This project is a proof-of-concept simulation designed to model a logic-based language for robotics. Inspired by *Tarski’s World from Language, Proof, and Logic (LPL)*, the software defines a structured world where a robot can reason about objects, locations, and actions using logical predicates and formula.

The primary goal is not to produce a fully functional robotics system or simulation, but to define a language that could feasibly be expanded into real-world applications. The simulation models a bounded environment with a set of predefined objects and actions. It supports simple reasoning about states, enabling the robot to plan and perform tasks like moving, picking up objects, and organizing them into storage areas.

Currently, it is not fully functional, as the simulation had a few bugs with the temporal records and picking up objects.


## Author
Thomas Byrne

## Date
4/25/2025

## Installation
Instructions for how to install the software:

```bash
git clone https://github.com/Artificys/robotic-logic-world.git
cd robotic-logic-world
npm install
```

## Usage
Instructions for how to run the software:

```bash
npm run dev
```