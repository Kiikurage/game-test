// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform13_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform13 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform26_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform26 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform9 : mat4x4<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform12 : f32,
	nodeUniform34 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : vec3<f32>,
	nodeUniform37 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : f32,
	nodeUniform33 : f32,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform23 : mat4x4<f32>,
	nodeUniform24 : f32,
	nodeUniform25 : f32,
	nodeUniform29 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar1 : vec3<f32>;
var<private> nodeVar2 : vec3<f32>;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec2<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : vec4<f32>;
var<private> nodeVar22 : vec4<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec4<f32>;
var<private> nodeVar50 : vec4<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec4<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec2<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec2<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec2<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = vec4<f32>( object.nodeUniform0, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar0 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform3, 0.0525 ) + max( max( nodeVar0.x, nodeVar0.y ), nodeVar0.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar1 = normalize( normalWorld );
	nodeVar2 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar3 = pow( ( 1.0 - clamp( dot( nodeVar1, nodeVar2 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar4 = smoothstep( -0.35, 0.55, dot( nodeVar1, object.nodeUniform10 ) );
	nodeVar5 = smoothstep( -0.15, 0.85, ( - dot( nodeVar2, object.nodeUniform10 ) ) );
	nodeVar6 = ( vec3<f32>( 0.08, 0.14, 0.3 ) * vec3<f32>( 0.8 ) );
	EmissiveColor = mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform6 * vec3<f32>( nodeVar3 ) ) * vec3<f32>( nodeVar4 ) ) * vec3<f32>( ( ( nodeVar5 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform11 * vec3<f32>( nodeVar3 ) ) * vec3<f32>( ( 1.0 - ( nodeVar4 * nodeVar5 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar6 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar6, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform12 );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar7 = dot( normalView, positionViewDirection );
	nodeVar8 = textureSample( nodeUniform13, nodeUniform13_sampler, vec2<f32>( Roughness, clamp( nodeVar7, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar8;
	nodeVar9 = ( dfg.x + dfg.y );
	nodeVar10 = ( 1.0 / nodeVar9 );
	nodeVar11 = nodeVar10;
	nodeVar12 = ( nodeVar11 - 1.0 );
	nodeVar13 = ( SpecularColorBlended * vec3<f32>( nodeVar12 ) );
	nodeVar14 = ( nodeVar13 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar14;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar15 = dot( normalWorld, normalize( render.nodeUniform16 ) );
	nodeVar16 = ( nodeVar15 * 0.5 );
	nodeVar17 = ( nodeVar16 + 0.5 );
	nodeVar18 = mix( render.nodeUniform14, render.nodeUniform15, nodeVar17 );
	nodeVar19 = ( irradiance + nodeVar18 );
	irradiance = nodeVar19;
	nodeVar20 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar21 = vec4<f32>( nodeVar20, 0.0 );
	nodeVar22 = ( render.cameraViewMatrix * nodeVar21 );
	nodeVar23 = normalize( nodeVar22.xyz );
	nodeVar24 = nodeVar23;
	nodeVar25 = dot( normalView, nodeVar24 );
	nodeVar26 = ( vec3<f32>( clamp( nodeVar25, 0.0, 1.0 ) ) * render.nodeUniform19 );
	nodeVar27 = nodeVar26;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar28 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar29 = ( nodeVar27 * nodeVar28 );
	nodeVar30 = ( nodeVar24 + positionViewDirection );
	nodeVar31 = normalize( nodeVar30 );
	nodeVar32 = dot( positionViewDirection, nodeVar31 );
	nodeVar33 = clamp( nodeVar32, 0.0, 1.0 );
	nodeVar34 = exp2( ( ( ( nodeVar33 * -5.55473 ) - 6.98316 ) * nodeVar33 ) );
	nodeVar35 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar34 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar34 ) ) );
	nodeVar36 = ( vec3<f32>( 1.0 ) - nodeVar35 );
	nodeVar37 = nodeVar36;
	nodeVar38 = ( nodeVar29 * nodeVar37 );
	nodeVar39 = ( directDiffuse + nodeVar38 );
	directDiffuse = nodeVar39;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar40 = normalize( ( nodeVar24 + positionViewDirection ) );
	nodeVar41 = clamp( dot( positionViewDirection, nodeVar40 ), 0.0, 1.0 );
	nodeVar42 = exp2( ( ( ( nodeVar41 * -5.55473 ) - 6.98316 ) * nodeVar41 ) );
	nodeVar43 = ( Roughness * Roughness );
	nodeVar44 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar42 ) ) ) + vec3<f32>( ( 1.0 * nodeVar42 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar43, clamp( dot( normalView, nodeVar24 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar43, clamp( dot( normalView, nodeVar40 ), 0.0, 1.0 ) ) ) );
	nodeVar45 = ( nodeVar27 * nodeVar44 );
	nodeVar46 = ( nodeVar45 * multiScatteringCompensation );
	nodeVar47 = ( directSpecular + nodeVar46 );
	directSpecular = nodeVar47;
	nodeVar48 = ( render.nodeUniform20 - render.nodeUniform21 );
	nodeVar49 = vec4<f32>( nodeVar48, 0.0 );
	nodeVar50 = ( render.cameraViewMatrix * nodeVar49 );
	nodeVar51 = normalize( nodeVar50.xyz );
	nodeVar52 = nodeVar51;
	nodeVar53 = dot( normalView, nodeVar52 );
	shadowPositionWorld = v_positionWorld;
	nodeVar55 = ( render.nodeUniform23 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform24 ) ) ), 1.0 ) );
	nodeVar56 = ( nodeVar55.xyz / vec3<f32>( nodeVar55.w ) );
	nodeVar57 = vec3<f32>( nodeVar56.x, ( 1.0 - nodeVar56.y ), ( nodeVar56.z + render.nodeUniform25 ) );

	if ( ( ( ( ( ( nodeVar57.x >= 0.0 ) && ( nodeVar57.x <= 1.0 ) ) && ( nodeVar57.y >= 0.0 ) ) && ( nodeVar57.y <= 1.0 ) ) && ( nodeVar57.z <= 1.0 ) ) ) {

		nodeVar58 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar59 = ( render.nodeUniform27 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform28 ).x );
		nodeVar60 = ( nodeVar57.xy + ( vogelDiskSample( 0, 5, nodeVar58 ) * vec2<f32>( nodeVar59 ) ) );
		nodeVar61 = textureSampleCompare( nodeUniform26, nodeUniform26_sampler, nodeVar60, nodeVar57.z );
		nodeVar62 = ( nodeVar57.xy + ( vogelDiskSample( 1, 5, nodeVar58 ) * vec2<f32>( nodeVar59 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform26, nodeUniform26_sampler, nodeVar62, nodeVar57.z );
		nodeVar64 = ( nodeVar57.xy + ( vogelDiskSample( 2, 5, nodeVar58 ) * vec2<f32>( nodeVar59 ) ) );
		nodeVar65 = textureSampleCompare( nodeUniform26, nodeUniform26_sampler, nodeVar64, nodeVar57.z );
		nodeVar66 = ( nodeVar57.xy + ( vogelDiskSample( 3, 5, nodeVar58 ) * vec2<f32>( nodeVar59 ) ) );
		nodeVar67 = textureSampleCompare( nodeUniform26, nodeUniform26_sampler, nodeVar66, nodeVar57.z );
		nodeVar68 = ( nodeVar57.xy + ( vogelDiskSample( 4, 5, nodeVar58 ) * vec2<f32>( nodeVar59 ) ) );
		nodeVar69 = textureSampleCompare( nodeUniform26, nodeUniform26_sampler, nodeVar68, nodeVar57.z );
		nodeVar54 = ( ( ( ( ( nodeVar61 + nodeVar63 ) + nodeVar65 ) + nodeVar67 ) + nodeVar69 ) * 0.2 );

	} else {

		nodeVar54 = 1.0;

	}

	nodeVar70 = mix( 1.0, nodeVar54, render.nodeUniform29 );
	nodeVar71 = ( vec3<f32>( clamp( nodeVar53, 0.0, 1.0 ) ) * ( render.nodeUniform22 * vec3<f32>( nodeVar70 ) ) );
	nodeVar72 = nodeVar71;
	nodeVar73 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar74 = ( nodeVar72 * nodeVar73 );
	nodeVar75 = ( nodeVar52 + positionViewDirection );
	nodeVar76 = normalize( nodeVar75 );
	nodeVar77 = dot( positionViewDirection, nodeVar76 );
	nodeVar78 = clamp( nodeVar77, 0.0, 1.0 );
	nodeVar79 = exp2( ( ( ( nodeVar78 * -5.55473 ) - 6.98316 ) * nodeVar78 ) );
	nodeVar80 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar79 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar79 ) ) );
	nodeVar81 = ( vec3<f32>( 1.0 ) - nodeVar80 );
	nodeVar82 = nodeVar81;
	nodeVar83 = ( nodeVar74 * nodeVar82 );
	nodeVar84 = ( directDiffuse + nodeVar83 );
	directDiffuse = nodeVar84;
	nodeVar85 = normalize( ( nodeVar52 + positionViewDirection ) );
	nodeVar86 = clamp( dot( positionViewDirection, nodeVar85 ), 0.0, 1.0 );
	nodeVar87 = exp2( ( ( ( nodeVar86 * -5.55473 ) - 6.98316 ) * nodeVar86 ) );
	nodeVar88 = ( Roughness * Roughness );
	nodeVar89 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar87 ) ) ) + vec3<f32>( ( 1.0 * nodeVar87 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar88, clamp( dot( normalView, nodeVar52 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar88, clamp( dot( normalView, nodeVar85 ), 0.0, 1.0 ) ) ) );
	nodeVar90 = ( nodeVar72 * nodeVar89 );
	nodeVar91 = ( nodeVar90 * multiScatteringCompensation );
	nodeVar92 = ( directSpecular + nodeVar91 );
	directSpecular = nodeVar92;
	nodeVar93 = ( render.nodeUniform30 - v_positionView );
	nodeVar94 = normalize( nodeVar93 );
	nodeVar95 = dot( normalView, nodeVar94 );

	if ( ( render.nodeUniform32 > 0.0 ) ) {

		nodeVar97 = length( nodeVar93 );
		nodeVar98 = ( nodeVar97 / render.nodeUniform32 );
		nodeVar99 = clamp( ( 1.0 - ( ( ( nodeVar98 * nodeVar98 ) * nodeVar98 ) * nodeVar98 ) ), 0.0, 1.0 );
		nodeVar96 = ( ( 1.0 / max( pow( nodeVar97, render.nodeUniform33 ), 0.01 ) ) * ( nodeVar99 * nodeVar99 ) );

	} else {

		nodeVar96 = ( 1.0 / max( pow( length( nodeVar93 ), render.nodeUniform33 ), 0.01 ) );

	}

	nodeVar100 = ( render.nodeUniform31 * vec3<f32>( nodeVar96 ) );
	nodeVar101 = ( vec3<f32>( clamp( nodeVar95, 0.0, 1.0 ) ) * nodeVar100 );
	nodeVar102 = nodeVar101;
	nodeVar103 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar104 = ( nodeVar102 * nodeVar103 );
	nodeVar105 = ( nodeVar94 + positionViewDirection );
	nodeVar106 = normalize( nodeVar105 );
	nodeVar107 = dot( positionViewDirection, nodeVar106 );
	nodeVar108 = clamp( nodeVar107, 0.0, 1.0 );
	nodeVar109 = exp2( ( ( ( nodeVar108 * -5.55473 ) - 6.98316 ) * nodeVar108 ) );
	nodeVar110 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar109 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar109 ) ) );
	nodeVar111 = ( vec3<f32>( 1.0 ) - nodeVar110 );
	nodeVar112 = nodeVar111;
	nodeVar113 = ( nodeVar104 * nodeVar112 );
	nodeVar114 = ( directDiffuse + nodeVar113 );
	directDiffuse = nodeVar114;
	nodeVar115 = normalize( ( nodeVar94 + positionViewDirection ) );
	nodeVar116 = clamp( dot( positionViewDirection, nodeVar115 ), 0.0, 1.0 );
	nodeVar117 = exp2( ( ( ( nodeVar116 * -5.55473 ) - 6.98316 ) * nodeVar116 ) );
	nodeVar118 = ( Roughness * Roughness );
	nodeVar119 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar117 ) ) ) + vec3<f32>( ( 1.0 * nodeVar117 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar118, clamp( dot( normalView, nodeVar94 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar118, clamp( dot( normalView, nodeVar115 ), 0.0, 1.0 ) ) ) );
	nodeVar120 = ( nodeVar102 * nodeVar119 );
	nodeVar121 = ( nodeVar120 * multiScatteringCompensation );
	nodeVar122 = ( directSpecular + nodeVar121 );
	directSpecular = nodeVar122;
	nodeVar123 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar124 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar125 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar126 = ( SpecularF90 * dfg.y );
	nodeVar127 = ( nodeVar125 + vec3<f32>( nodeVar126 ) );
	nodeVar128 = ( nodeVar123 + nodeVar127 );
	nodeVar123 = nodeVar128;
	nodeVar129 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar130 = nodeVar129;
	nodeVar131 = ( nodeVar130 * vec3<f32>( 0.047619 ) );
	nodeVar132 = ( SpecularColor + nodeVar131 );
	nodeVar133 = ( nodeVar127 * nodeVar132 );
	nodeVar134 = ( dfg.x + dfg.y );
	nodeVar135 = ( 1.0 - nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( vec3<f32>( nodeVar136 ) * nodeVar132 );
	nodeVar138 = ( vec3<f32>( 1.0 ) - nodeVar137 );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( nodeVar133 / nodeVar139 );
	nodeVar141 = ( nodeVar140 * vec3<f32>( nodeVar136 ) );
	nodeVar142 = ( nodeVar124 + nodeVar141 );
	nodeVar124 = nodeVar142;
	nodeVar143 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar144 = ( irradiance * nodeVar143 );
	nodeVar145 = ( nodeVar123 + nodeVar124 );
	nodeVar146 = ( vec3<f32>( 1.0 ) - nodeVar145 );
	nodeVar147 = nodeVar146;
	nodeVar148 = ( nodeVar144 * nodeVar147 );
	nodeVar149 = nodeVar148;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar150 = ( indirectDiffuse + nodeVar149 );
	indirectDiffuse = nodeVar150;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar151 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar152 = ( SpecularF90 * dfg.y );
	nodeVar153 = ( nodeVar151 + vec3<f32>( nodeVar152 ) );
	nodeVar154 = ( singleScatteringDielectric + nodeVar153 );
	singleScatteringDielectric = nodeVar154;
	nodeVar155 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar156 = nodeVar155;
	nodeVar157 = ( nodeVar156 * vec3<f32>( 0.047619 ) );
	nodeVar158 = ( SpecularColor + nodeVar157 );
	nodeVar159 = ( nodeVar153 * nodeVar158 );
	nodeVar160 = ( dfg.x + dfg.y );
	nodeVar161 = ( 1.0 - nodeVar160 );
	nodeVar162 = nodeVar161;
	nodeVar163 = ( vec3<f32>( nodeVar162 ) * nodeVar158 );
	nodeVar164 = ( vec3<f32>( 1.0 ) - nodeVar163 );
	nodeVar165 = nodeVar164;
	nodeVar166 = ( nodeVar159 / nodeVar165 );
	nodeVar167 = ( nodeVar166 * vec3<f32>( nodeVar162 ) );
	nodeVar168 = ( multiScatteringDielectric + nodeVar167 );
	multiScatteringDielectric = nodeVar168;
	nodeVar169 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar170 = ( SpecularF90 * dfg.y );
	nodeVar171 = ( nodeVar169 + vec3<f32>( nodeVar170 ) );
	nodeVar172 = ( singleScatteringMetallic + nodeVar171 );
	singleScatteringMetallic = nodeVar172;
	nodeVar173 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( nodeVar174 * vec3<f32>( 0.047619 ) );
	nodeVar176 = ( DiffuseColor.xyz + nodeVar175 );
	nodeVar177 = ( nodeVar171 * nodeVar176 );
	nodeVar178 = ( dfg.x + dfg.y );
	nodeVar179 = ( 1.0 - nodeVar178 );
	nodeVar180 = nodeVar179;
	nodeVar181 = ( vec3<f32>( nodeVar180 ) * nodeVar176 );
	nodeVar182 = ( vec3<f32>( 1.0 ) - nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( nodeVar177 / nodeVar183 );
	nodeVar185 = ( nodeVar184 * vec3<f32>( nodeVar180 ) );
	nodeVar186 = ( multiScatteringMetallic + nodeVar185 );
	multiScatteringMetallic = nodeVar186;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar187 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar188 = ( radiance * nodeVar187 );
	nodeVar189 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar190 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar191 = ( nodeVar189 * nodeVar190 );
	nodeVar192 = ( nodeVar188 + nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar195 = ( vec3<f32>( 1.0 ) - nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( DiffuseContribution * nodeVar196 );
	nodeVar198 = ( nodeVar197 * nodeVar190 );
	nodeVar199 = nodeVar198;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar200 = ( indirectSpecular + nodeVar193 );
	indirectSpecular = nodeVar200;
	nodeVar201 = ( indirectDiffuse + nodeVar199 );
	indirectDiffuse = nodeVar201;
	ambientOcclusion = 1.0;
	nodeVar202 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar202;
	nodeVar203 = dot( normalView, positionViewDirection );
	nodeVar204 = ( clamp( nodeVar203, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar205 = ( Roughness * -16.0 );
	nodeVar206 = ( 1.0 - nodeVar205 );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( - nodeVar207 );
	nodeVar209 = exp2( nodeVar208 );
	nodeVar210 = pow( nodeVar204, nodeVar209 );
	nodeVar211 = ( 1.0 - nodeVar210 );
	nodeVar212 = nodeVar211;
	nodeVar213 = ( ambientOcclusion - nodeVar212 );
	nodeVar214 = ( indirectSpecular * vec3<f32>( clamp( nodeVar213, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar214;
	nodeVar215 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar215;
	nodeVar216 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar216;
	nodeVar217 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar217;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar218 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar219 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform34, object.nodeUniform35, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform36 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform37 * object.nodeUniform37 ) * nodeVar218 ) * nodeVar218 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar219;

	// result

	output.color = nodeVar219;

	return output;

}
