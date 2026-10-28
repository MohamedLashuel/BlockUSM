import * as lib from "../lib";
import $ from "jquery";
import 'jquery-validation'

async function submitOverride(event: Event){
	event.preventDefault();
	const minutes: number = Number($("#override_minutes").val())
	lib.startOverride(minutes);
	alert("Override started (for block sets that allow it).")
}

function onReady(){
	$("form").validate({
		rules: { override_minutes: "digits" },
		messages: { override_minutes: "Must be a whole number greater than 0" }
	});
	$("#submit").on("click", submitOverride);
}

$(document).ready(onReady)